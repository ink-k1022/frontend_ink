// ==================== 全局變數 ====================
let currentLocation = null;
let venues = [];
let currentWeights = {
    distance: 50,
    rating: 50
};
let currentFilters = {
    radius: 1000,
    minRating: 4,
    openNow: false,
    category: null,
    searchQuery: ''
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        showLoading(true, '正在初始化應用程式...');
        
        // 初始化 Google Maps
        await googleMapsService.initialize('map');
        CONFIG.log('地圖初始化完成');
        
        // 初始化事件監聽器
        initializeEventListeners();
        
        // 請求使用者位置
        await requestUserLocation();
        
        showLoading(false);
        
    } catch (error) {
        CONFIG.error('初始化失敗:', error);
        showLoading(false);
        alert('系統初始化失敗：' + error.message);
    }
});

// ==================== 事件監聽器 ====================
function initializeEventListeners() {
    // 權重滑桿
    const distanceWeight = document.getElementById('distanceWeight');
    const ratingWeight = document.getElementById('ratingWeight');
    
    distanceWeight.addEventListener('input', function(e) {
        currentWeights.distance = parseInt(e.target.value);
        currentWeights.rating = 100 - currentWeights.distance;
        ratingWeight.value = currentWeights.rating;
        updateWeightDisplays();
        updateResults();
    });
    
    ratingWeight.addEventListener('input', function(e) {
        currentWeights.rating = parseInt(e.target.value);
        currentWeights.distance = 100 - currentWeights.rating;
        distanceWeight.value = currentWeights.distance;
        updateWeightDisplays();
        updateResults();
    });
    
    // 快速模式按鈕
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const mode = this.dataset.mode;
            if (mode === 'distance') {
                currentWeights.distance = 80;
                currentWeights.rating = 20;
            } else if (mode === 'balanced') {
                currentWeights.distance = 50;
                currentWeights.rating = 50;
            } else if (mode === 'quality') {
                currentWeights.distance = 20;
                currentWeights.rating = 80;
            }
            
            distanceWeight.value = currentWeights.distance;
            ratingWeight.value = currentWeights.rating;
            updateWeightDisplays();
            updateResults();
        });
    });
    
    // 分類篩選
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            
            if (currentFilters.category === this.dataset.category) {
                currentFilters.category = null;
            } else {
                this.classList.add('active');
                currentFilters.category = this.dataset.category;
            }
            
            fetchAndUpdateVenues();
        });
    });
    
    // 搜尋
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // 篩選器
    document.getElementById('radiusFilter').addEventListener('change', function(e) {
        currentFilters.radius = parseInt(e.target.value);
        fetchAndUpdateVenues();
    });
    
    document.getElementById('minRatingFilter').addEventListener('change', function(e) {
        currentFilters.minRating = parseFloat(e.target.value);
        updateResults();
    });
    
    document.getElementById('openNowFilter').addEventListener('change', function(e) {
        currentFilters.openNow = e.target.checked;
        updateResults();
    });
    
    // 排序
    document.getElementById('sortBy').addEventListener('change', function() {
        updateResults();
    });
    
    // 地圖控制
    document.getElementById('locateBtn').addEventListener('click', requestUserLocation);
    document.getElementById('refreshBtn').addEventListener('click', function() {
        fetchAndUpdateVenues();
    });
    
    // 彈窗關閉
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

// ==================== 地理定位 ====================
async function requestUserLocation() {
    showLoading(true, '正在定位中...');
    updateLocationStatus('正在定位中...', '📍');
    
    if (!navigator.geolocation) {
        updateLocationStatus('您的瀏覽器不支援地理定位', '❌');
        showLoading(false);
        return;
    }
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: CONFIG.APP.GEOLOCATION_TIMEOUT,
                maximumAge: CONFIG.APP.GEOLOCATION_MAX_AGE
            });
        });
        
        currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        CONFIG.log('定位成功:', currentLocation);
        
        // 更新地圖
        googleMapsService.addUserMarker(currentLocation);
        googleMapsService.setCenter(currentLocation);
        
        updateLocationStatus('定位成功', '✅');
        setTimeout(() => {
            document.getElementById('locationStatus').style.display = 'none';
        }, 2000);
        
        // 獲取周邊店家
        await fetchAndUpdateVenues();
        
    } catch (error) {
        CONFIG.error('定位失敗:', error);
        
        let message = '定位失敗';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = '請允許位置權限';
                break;
            case error.POSITION_UNAVAILABLE:
                message = '位置資訊無法取得';
                break;
            case error.TIMEOUT:
                message = '定位請求逾時';
                break;
        }
        
        updateLocationStatus(message, '❌');
        
        // 使用預設位置（台北101）
        currentLocation = CONFIG.GOOGLE_MAPS.DEFAULT_CENTER;
        googleMapsService.addUserMarker(currentLocation);
        googleMapsService.setCenter(currentLocation);
        
        await fetchAndUpdateVenues();
    } finally {
        showLoading(false);
    }
}

function updateLocationStatus(text, icon) {
    const statusElement = document.getElementById('locationStatus');
    statusElement.style.display = 'flex';
    statusElement.querySelector('.status-text').textContent = text;
    statusElement.querySelector('.status-icon').textContent = icon;
}

// ==================== 從後端獲取店家資料 ====================
async function fetchAndUpdateVenues() {
    if (!currentLocation) {
        CONFIG.log('尚未取得位置資訊');
        return;
    }
    
    try {
        showLoading(true, '正在搜尋附近店家...');
        
        // 準備 API 請求參數
        const params = {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            radius: currentFilters.radius,
            minRating: 0, // 先從 API 取得所有資料，前端再篩選
            limit: CONFIG.APP.MAX_RESULTS
        };
        
        // 如果有分類篩選，加入參數
        if (currentFilters.category) {
            params.category = currentFilters.category;
        }
        
        // 如果有營業狀態篩選，加入參數
        if (currentFilters.openNow) {
            params.openNow = true;
        }
        
        CONFIG.log('API 請求參數:', params);
        
        // 呼叫 API
        const response = await apiService.getVenues(params);
        
        // 處理回應資料
        if (response.success && Array.isArray(response.data)) {
            venues = response.data;
            CONFIG.log(`成功取得 ${venues.length} 筆店家資料`);
        } else {
            throw new Error('API 回應格式錯誤');
        }
        
        // 更新結果顯示
        updateResults();
        
    } catch (error) {
        CONFIG.error('取得店家資料失敗:', error);
        
        // 如果 API 失敗且啟用模擬資料，使用模擬資料
        if (CONFIG.DEV.ENABLE_MOCK_DATA) {
            CONFIG.log('使用模擬資料');
            loadMockData();
            updateResults();
        } else {
            alert('無法取得店家資料：' + error.message);
            venues = [];
            updateResults();
        }
    } finally {
        showLoading(false);
    }
}

// ==================== 搜尋功能 ====================
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        // 如果搜尋框為空，重新獲取周邊店家
        currentFilters.searchQuery = '';
        await fetchAndUpdateVenues();
        return;
    }
    
    if (!currentLocation) {
        alert('請先允許位置權限');
        return;
    }
    
    try {
        showLoading(true, '正在搜尋...');
        
        const searchData = {
            query: query,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            radius: currentFilters.radius,
            filters: {
                category: currentFilters.category,
                minRating: currentFilters.minRating,
                openNow: currentFilters.openNow
            }
        };
        
        const response = await apiService.searchVenues(searchData);
        
        if (response.success && Array.isArray(response.data)) {
            venues = response.data;
            currentFilters.searchQuery = query;
            CONFIG.log(`搜尋到 ${venues.length} 筆結果`);
            updateResults();
        } else {
            throw new Error('搜尋失敗');
        }
        
    } catch (error) {
        CONFIG.error('搜尋失敗:', error);
        alert('搜尋失敗：' + error.message);
    } finally {
        showLoading(false);
    }
}

// ==================== 權重計算演算法 ====================
function calculateScore(venue) {
    if (!currentLocation) return 0;
    
    // 計算距離（如果後端沒有提供）
    if (!venue.distance) {
        venue.distance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            venue.lat,
            venue.lng
        );
    }
    
    // 距離歸一化（0-1，距離越近分數越高）
    const maxDistance = currentFilters.radius;
    const normalizedDistance = 1 - Math.min(venue.distance / maxDistance, 1);
    
    // 評分歸一化（0-1）
    const normalizedRating = venue.rating / 5;
    
    // 評論數加成（0-0.2）
    const reviewBonus = Math.min(venue.reviewCount / 500, 0.2);
    
    // 權重計算
    const Wd = currentWeights.distance / 100;
    const Wr = currentWeights.rating / 100;
    
    // 綜合分數公式：Score = Wd × normalizedDistance + Wr × (normalizedRating + reviewBonus)
    const score = (Wd * normalizedDistance) + (Wr * (normalizedRating + reviewBonus));
    
    return score * 100; // 轉換為0-100分
}

// Haversine 距離計算公式
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半徑（公尺）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // 返回公尺
}
// ==================== 篩選與排序 ====================
function filterAndSortVenues() {
    let filtered = venues.filter(venue => {
        // 距離篩選（已由後端處理，這裡再次確認）
        if (venue.distance > currentFilters.radius) return false;
        
        // 評分篩選
        if (venue.rating < currentFilters.minRating) return false;
        
        // 營業狀態篩選
        if (currentFilters.openNow && !venue.isOpen) return false;
        
        // 分類篩選（已由後端處理，這裡再次確認）
        if (currentFilters.category && venue.category !== currentFilters.category) return false;
        
        // 搜尋關鍵字篩選（已由後端處理）
        // 這裡不需要再次篩選
        
        return true;
    });
    
    // 計算分數
    filtered.forEach(venue => {
        venue.score = calculateScore(venue);
    });
    
    // 排序
    const sortBy = document.getElementById('sortBy').value;
    filtered.sort((a, b) => {
        switch(sortBy) {
            case 'score':
                return b.score - a.score;
            case 'distance':
                return a.distance - b.distance;
            case 'rating':
                return b.rating - a.rating;
            case 'reviews':
                return b.reviewCount - a.reviewCount;
            default:
                return b.score - a.score;
        }
    });
    
    return filtered;
}

// ==================== 更新結果 ====================
function updateResults() {
    if (!currentLocation) return;
    
    const filtered = filterAndSortVenues();
    
    // 更新統計
    updateStatistics(filtered);
    
    // 更新列表
    renderResultsList(filtered);
    
    // 更新地圖標記
    googleMapsService.addVenueMarkers(filtered, function(venue) {
        highlightResultCard(venue.id);
    });
}

function updateStatistics(venues) {
    document.getElementById('totalResults').textContent = venues.length;
    
    if (venues.length > 0) {
        const avgDist = venues.reduce((sum, v) => sum + v.distance, 0) / venues.length;
        const avgRat = venues.reduce((sum, v) => sum + v.rating, 0) / venues.length;
        
        document.getElementById('avgDistance').textContent = formatDistance(avgDist);
        document.getElementById('avgRating').textContent = avgRat.toFixed(1) + '★';
    } else {
        document.getElementById('avgDistance').textContent = '-';
        document.getElementById('avgRating').textContent = '-';
    }
}

function renderResultsList(venues) {
    const listContainer = document.getElementById('resultsList');
    
    if (venues.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">找不到符合條件的店家</div>
                <div class="empty-text">試著調整篩選條件或擴大搜尋範圍</div>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = venues.map((venue, index) => `
        <div class="result-card" data-id="${venue.id}" onclick="showVenueDetails(${venue.id})">
            <div class="result-rank">${index + 1}</div>
            <h3 class="result-name">${venue.name}</h3>
            <span class="result-category">${getCategoryName(venue.category)}</span>
            
            <div class="result-rating">
                <span class="stars">${generateStars(venue.rating)}</span>
                <span class="rating-value">${venue.rating.toFixed(1)}</span>
                <span class="rating-count">(${venue.reviewCount})</span>
            </div>
            
            <div class="result-distance">
                <span>📍</span>
                <span>${formatDistance(venue.distance)}</span>
                ${venue.isOpen ? '<span class="badge badge-success">營業中</span>' : '<span class="badge badge-error">休息中</span>'}
            </div>
            
            <div class="result-score">
                <span class="score-label">智能分數</span>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${venue.score}%"></div>
                </div>
                <span class="score-value">${venue.score.toFixed(0)}</span>
            </div>
        </div>
    `).join('');
}

function highlightResultCard(venueId) {
    document.querySelectorAll('.result-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const card = document.querySelector(`[data-id="${venueId}"]`);
    if (card) {
        card.classList.add('selected');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ==================== 店家詳情 ====================
async function showVenueDetails(venueId) {
    try {
        showLoading(true, '正在載入詳情...');
        
        // 從 API 取得詳細資料
        const response = await apiService.getVenueDetail(venueId);
        
        let venue;
        if (response.success) {
            venue = response.data;
        } else {
            // 如果 API 失敗，使用本地資料
            venue = venues.find(v => v.id === venueId);
            if (!venue) {
                throw new Error('找不到店家資料');
            }
        }
        
        const modal = document.getElementById('detailModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="detail-header">
                <h2 class="detail-name">${venue.name}</h2>
                <div class="detail-meta">
                    <span class="result-category">${getCategoryName(venue.category)}</span>
                    ${venue.isOpen ? '<span class="badge badge-success">營業中</span>' : '<span class="badge badge-error">休息中</span>'}
                </div>
            </div>
            
            <div class="detail-body">
                <div class="detail-section">
                    <h3 class="detail-section-title">
                        <span>⭐</span>
                        評價資訊
                    </h3>
                    <div class="result-rating" style="margin-bottom: 16px;">
                        <span class="stars" style="font-size: 1.5rem;">${generateStars(venue.rating)}</span>
                        <span class="rating-value" style="font-size: 1.25rem;">${venue.rating.toFixed(1)}</span>
                        <span class="rating-count">(${venue.reviewCount} 則評論)</span>
                    </div>
                    <div class="result-score">
                        <span class="score-label">智能推薦分數</span>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${venue.score || 0}%"></div>
                        </div>
                        <span class="score-value">${(venue.score || 0).toFixed(0)}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3 class="detail-section-title">
                        <span>📍</span>
                        位置資訊
                    </h3>
                    <div class="detail-info-grid">
                        <div class="info-item">
                            <span class="info-icon">📏</span>
                            <div class="info-content">
                                <div class="info-label">距離</div>
                                <div class="info-value">${formatDistance(venue.distance)}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">🚶</span>
                            <div class="info-content">
                                <div class="info-label">步行時間</div>
                                <div class="info-value">${estimateWalkTime(venue.distance)}</div>
                            </div>
                        </div>
                        <div class="info-item" style="grid-column: 1 / -1;">
                            <span class="info-icon">📮</span>
                            <div class="info-content">
                                <div class="info-label">地址</div>
                                <div class="info-value">${venue.address || '地址資訊未提供'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3 class="detail-section-title">
                        <span>⏰</span>
                        營業時間
                    </h3>
                    <div class="info-value">${venue.hours || '週一至週日 09:00 - 22:00'}</div>
                </div>
                
                ${venue.phone ? `
                <div class="detail-section">
                    <h3 class="detail-section-title">
                        <span>📞</span>
                        聯絡電話
                    </h3>
                    <div class="info-value"><a href="tel:${venue.phone}">${venue.phone}</a></div>
                </div>
                ` : ''}
            </div>
            
            <div class="detail-actions">
                <button class="action-btn" onclick="openGoogleMaps(${venue.lat}, ${venue.lng})">
                    <span>🗺️</span>
                    導航
                </button>
                <button class="action-btn" onclick="shareVenue(${venue.id})">
                    <span>📤</span>
                    分享
                </button>
                <button class="action-btn primary" onclick="closeModal()">
                    <span>✓</span>
                    關閉
                </button>
            </div>
        `;
        
        modal.classList.add('active');
        
    } catch (error) {
        CONFIG.error('載入店家詳情失敗:', error);
        alert('載入失敗：' + error.message);
    } finally {
        showLoading(false);
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// ==================== 權重顯示更新 ====================
function updateWeightDisplays() {
    document.getElementById('distanceWeightValue').textContent = currentWeights.distance + '%';
    document.getElementById('ratingWeightValue').textContent = currentWeights.rating + '%';
}

// ==================== 輔助函數 ====================
function formatDistance(meters) {
    if (meters < 1000) {
        return Math.round(meters) + ' 公尺';
    } else {
        return (meters / 1000).toFixed(1) + ' 公里';
    }
}

function estimateWalkTime(meters) {
    const minutes = Math.round(meters / 80); // 假設每分鐘走80公尺
    if (minutes < 1) return '< 1 分鐘';
    return minutes + ' 分鐘';
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '⯨' : '') + 
           '☆'.repeat(emptyStars);
}

function getCategoryName(category) {
    const categories = {
        'restaurant': '🍽️ 餐廳',
        'cafe': '☕ 咖啡廳',
        'convenience': '🏪 便利商店',
        'gas': '⛽ 加油站',
        'salon': '💇 美髮',
        'pharmacy': '💊 藥局',
        'bakery': '🥖 烘焙坊',
        'gym': '💪 健身房',
        'bookstore': '📚 書店'
    };
    return categories[category] || category;
}

function openGoogleMaps(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

function shareVenue(venueId) {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;
    
    const text = `推薦你這家店：${venue.name}\n評分：${venue.rating}★ (${venue.reviewCount}則評論)\n距離：${formatDistance(venue.distance)}`;
    
    if (navigator.share) {
        navigator.share({
            title: venue.name,
            text: text
        }).catch(() => {
            // 如果分享失敗，複製到剪貼簿
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('已複製到剪貼簿！');
    }).catch(err => {
        CONFIG.error('複製失敗:', err);
    });
}

function showLoading(show, message = '載入中...') {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
        const loadingText = overlay.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    } else {
        overlay.classList.remove('active');
    }
}

// ==================== 模擬資料（開發用）====================
function loadMockData() {
    // 以當前位置為中心的模擬店家資料
    const baseLocation = currentLocation || CONFIG.GOOGLE_MAPS.DEFAULT_CENTER;
    
    venues = [
        {
            id: 1,
            name: '星巴克信義旗艦店',
            category: 'cafe',
            lat: baseLocation.lat + 0.002,
            lng: baseLocation.lng + 0.001,
            rating: 4.5,
            reviewCount: 328,
            isOpen: true,
            address: '台北市信義區信義路五段7號',
            phone: '02-2345-6789',
            hours: '週一至週日 07:00 - 22:00'
        },
        {
            id: 2,
            name: '鼎泰豐信義店',
            category: 'restaurant',
            lat: baseLocation.lat + 0.003,
            lng: baseLocation.lng - 0.002,
            rating: 4.8,
            reviewCount: 856,
            isOpen: true,
            address: '台北市信義區市府路45號',
            phone: '02-2345-1234',
            hours: '週一至週日 11:00 - 21:30'
        },
        {
            id: 3,
            name: '7-ELEVEN 信義門市',
            category: 'convenience',
            lat: baseLocation.lat - 0.001,
            lng: baseLocation.lng + 0.002,
            rating: 4.2,
            reviewCount: 145,
            isOpen: true,
            address: '台北市信義區松智路17號',
            phone: '02-2345-9876',
            hours: '24小時營業'
        }
    ];
    
    // 計算距離
    venues.forEach(venue => {
        venue.distance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            venue.lat,
            venue.lng
        );
    });
    
    CONFIG.log(`已載入 ${venues.length} 筆模擬資料`);
}
