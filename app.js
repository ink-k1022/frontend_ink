// ==================== 全局變數 ====================
let map;
let userMarker;
let currentLocation = null;
let venues = [];
let markers = [];
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
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();
    requestUserLocation();
    loadMockData();
});

// ==================== 地圖初始化 ====================
function initializeMap() {
    // 初始化地圖（預設台北101）
    map = L.map('map').setView([25.0330, 121.5654], 15);
    
    // 添加圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

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
            
            updateResults();
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
        updateResults();
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
        loadMockData();
        updateResults();
    });
    
    // 彈窗關閉
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

// ==================== 更新權重顯示 ====================
function updateWeightDisplays() {
    document.getElementById('distanceWeightValue').textContent = currentWeights.distance + '%';
    document.getElementById('ratingWeightValue').textContent = currentWeights.rating + '%';
}
// ==================== 地圖標記更新 ====================
function updateMapMarkers(venues) {
    // 清除舊標記
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // 添加新標記
    venues.forEach((venue, index) => {
        const marker = L.marker([venue.lat, venue.lng], {
            icon: L.divIcon({
                className: 'venue-marker',
                html: `
                    <div style="
                        background: ${index === 0 ? '#2563eb' : '#10b981'};
                        color: white;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">${index + 1}</div>
                `,
                iconSize: [32, 32]
            })
        }).addTo(map);
        
        marker.bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${venue.name}</h3>
                <div style="margin-bottom: 4px;">
                    <span style="color: #f59e0b;">${generateStars(venue.rating)}</span>
                    <span style="font-weight: bold;">${venue.rating.toFixed(1)}</span>
                    <span style="color: #64748b;">(${venue.reviewCount})</span>
                </div>
                <div style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
                    📍 ${formatDistance(venue.distance)}
                </div>
                <button onclick="showVenueDetails(${venue.id})" style="
                    width: 100%;
                    padding: 8px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                ">查看詳情</button>
            </div>
        `);
        
        marker.on('click', function() {
            highlightResultCard(venue.id);
        });
        
        markers.push(marker);
    });
    
    // 調整地圖視野以包含所有標記
    if (venues.length > 0 && userMarker) {
        const bounds = L.latLngBounds([
            ...venues.map(v => [v.lat, v.lng]),
            [currentLocation.lat, currentLocation.lng]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
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

// ==================== 搜尋功能 ====================
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    currentFilters.searchQuery = query;
    updateResults();
}

// ==================== 店家詳情 ====================
function showVenueDetails(venueId) {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;
    
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
                        <div class="score-fill" style="width: ${venue.score}%"></div>
                    </div>
                    <span class="score-value">${venue.score.toFixed(0)}</span>
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
                            <div class="info-value">${venue.address}</div>
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
                <div class="info-value">${venue.phone}</div>
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
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
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
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('已複製到剪貼簿！');
        });
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}
// ==================== 模擬資料 ====================
function loadMockData() {
    // 以台北101為中心的模擬店家資料
    const baseLocation = currentLocation || { lat: 25.0330, lng: 121.5654 };
    
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
        },
        {
            id: 4,
            name: '誠品信義店',
            category: 'bookstore',
            lat: baseLocation.lat + 0.004,
            lng: baseLocation.lng + 0.003,
            rating: 4.6,
            reviewCount: 492,
            isOpen: true,
            address: '台北市信義區松高路11號',
            phone: '02-2345-5555',
            hours: '週日至週四 11:00 - 22:00，週五至週六 11:00 - 23:00'
        },
        {
            id: 5,
            name: 'PAUL 法式烘焙',
            category: 'bakery',
            lat: baseLocation.lat - 0.002,
            lng: baseLocation.lng - 0.001,
            rating: 4.4,
            reviewCount: 267,
            isOpen: true,
            address: '台北市信義區忠孝東路五段68號',
            phone: '02-2345-7788',
            hours: '週一至週日 08:00 - 21:00'
        },
        {
            id: 6,
            name: '世界健身房信義店',
            category: 'gym',
            lat: baseLocation.lat + 0.005,
            lng: baseLocation.lng - 0.003,
            rating: 4.3,
            reviewCount: 189,
            isOpen: true,
            address: '台北市信義區基隆路一段178號',
            phone: '02-2345-3333',
            hours: '週一至週五 06:00 - 24:00，週六至週日 08:00 - 22:00'
        },
        {
            id: 7,
            name: '屈臣氏信義店',
            category: 'pharmacy',
            lat: baseLocation.lat - 0.003,
            lng: baseLocation.lng + 0.004,
            rating: 4.1,
            reviewCount: 234,
            isOpen: true,
            address: '台北市信義區松壽路12號',
            phone: '02-2345-4444',
            hours: '週一至週日 10:00 - 22:00'
        },
        {
            id: 8,
            name: '路易莎咖啡',
            category: 'cafe',
            lat: baseLocation.lat + 0.001,
            lng: baseLocation.lng - 0.003,
            rating: 4.4,
            reviewCount: 412,
            isOpen: true,
            address: '台北市信義區松仁路32號',
            phone: '02-2345-6666',
            hours: '週一至週日 07:30 - 21:30'
        },
        {
            id: 9,
            name: '欣葉台菜',
            category: 'restaurant',
            lat: baseLocation.lat - 0.004,
            lng: baseLocation.lng - 0.002,
            rating: 4.7,
            reviewCount: 623,
            isOpen: false,
            address: '台北市信義區松仁路58號',
            phone: '02-2345-2222',
            hours: '週一至週日 11:30 - 14:30, 17:30 - 21:30'
        },
        {
            id: 10,
            name: '台塑加油站',
            category: 'gas',
            lat: baseLocation.lat + 0.006,
            lng: baseLocation.lng + 0.005,
            rating: 4.0,
            reviewCount: 98,
            isOpen: true,
            address: '台北市信義區忠孝東路五段372號',
            phone: '02-2345-8888',
            hours: '24小時營業'
        },
        {
            id: 11,
            name: 'Amour髮藝沙龍',
            category: 'salon',
            lat: baseLocation.lat + 0.002,
            lng: baseLocation.lng + 0.004,
            rating: 4.6,
            reviewCount: 156,
            isOpen: true,
            address: '台北市信義區松德路168號',
            phone: '02-2345-1111',
            hours: '週二至週日 10:00 - 20:00（週一公休）'
        },
        {
            id: 12,
            name: '築地鮮魚',
            category: 'restaurant',
            lat: baseLocation.lat - 0.001,
            lng: baseLocation.lng - 0.004,
            rating: 4.5,
            reviewCount: 387,
            isOpen: true,
            address: '台北市信義區逸仙路42號',
            phone: '02-2345-9999',
            hours: '週一至週日 11:00 - 14:00, 17:00 - 21:00'
        },
        {
            id: 13,
            name: 'Cama Café',
            category: 'cafe',
            lat: baseLocation.lat + 0.003,
            lng: baseLocation.lng + 0.002,
            rating: 4.3,
            reviewCount: 289,
            isOpen: true,
            address: '台北市信義區松高路19號',
            phone: '02-2345-7777',
            hours: '週一至週日 08:00 - 20:00'
        },
        {
            id: 14,
            name: '全家便利商店',
            category: 'convenience',
            lat: baseLocation.lat - 0.002,
            lng: baseLocation.lng + 0.003,
            rating: 4.1,
            reviewCount: 167,
            isOpen: true,
            address: '台北市信義區信義路五段150號',
            phone: '02-2345-0000',
            hours: '24小時營業'
        },
        {
            id: 15,
            name: '添好運點心專門店',
            category: 'restaurant',
            lat: baseLocation.lat + 0.004,
            lng: baseLocation.lng - 0.001,
            rating: 4.6,
            reviewCount: 534,
            isOpen: true,
            address: '台北市信義區松壽路18號',
            phone: '02-2345-3456',
            hours: '週一至週日 10:00 - 21:30'
        }
    ];
    
    console.log(`已載入 ${venues.length} 筆店家資料`);
}
