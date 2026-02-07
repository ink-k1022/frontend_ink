// ==================== Google Maps 服務層 ====================
// 處理所有與 Google Maps 相關的功能

class GoogleMapsService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userMarker = null;
        this.infoWindow = null;
        this.isLoaded = false;
    }

    // ==================== 初始化 Google Maps ====================
    async initialize(containerId = 'map') {
        try {
            // 等待 Google Maps API 載入
            await this.loadGoogleMapsAPI();
            
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`找不到地圖容器: ${containerId}`);
            }

            // 建立地圖
            this.map = new google.maps.Map(container, {
                center: CONFIG.GOOGLE_MAPS.DEFAULT_CENTER,
                zoom: CONFIG.GOOGLE_MAPS.DEFAULT_ZOOM,
                ...CONFIG.GOOGLE_MAPS.MAP_OPTIONS
            });

            // 建立 InfoWindow
            this.infoWindow = new google.maps.InfoWindow();

            this.isLoaded = true;
            CONFIG.log('Google Maps 初始化完成');
            
            return this.map;

        } catch (error) {
            CONFIG.error('Google Maps 初始化失敗:', error);
            throw error;
        }
    }

    // 動態載入 Google Maps API
    loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            // 檢查是否已載入
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            // 檢查 API Key
            if (!CONFIG.GOOGLE_MAPS.API_KEY || CONFIG.GOOGLE_MAPS.API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
                // 如果啟用模擬資料模式，不需要真實的 Google Maps
                if (CONFIG.DEV.ENABLE_MOCK_DATA) {
                    CONFIG.log('模擬資料模式：跳過 Google Maps API 載入');
                    reject(new Error('模擬資料模式：不載入 Google Maps API'));
                    return;
                }
                reject(new Error('請在 config.js 中設定 Google Maps API Key'));
                return;
            }

            // 建立 script 標籤
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS.API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                CONFIG.log('Google Maps API 載入完成');
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Google Maps API 載入失敗'));
            };

            document.head.appendChild(script);
        });
    }

    // ==================== 標記管理 ====================
    
    /**
     * 添加使用者位置標記
     * @param {Object} position - 位置 {lat, lng}
     */
    addUserMarker(position) {
        if (this.userMarker) {
            this.userMarker.setPosition(position);
        } else {
            this.userMarker = new google.maps.Marker({
                position: position,
                map: this.map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3
                },
                title: '您的位置',
                zIndex: 1000
            });

            // 添加脈衝圓圈效果
            new google.maps.Circle({
                map: this.map,
                center: position,
                radius: 50,
                strokeColor: '#2563eb',
                strokeOpacity: 0.5,
                strokeWeight: 2,
                fillColor: '#2563eb',
                fillOpacity: 0.1
            });
        }

        // 移動地圖中心到使用者位置
        this.map.setCenter(position);
    }

    /**
     * 添加店家標記
     * @param {Array} venues - 店家陣列
     * @param {Function} onMarkerClick - 點擊標記的回調函數
     */
    addVenueMarkers(venues, onMarkerClick) {
        // 清除舊標記
        this.clearMarkers();

        venues.forEach((venue, index) => {
            const marker = new google.maps.Marker({
                position: { lat: venue.lat, lng: venue.lng },
                map: this.map,
                title: venue.name,
                label: {
                    text: String(index + 1),
                    color: '#ffffff',
                    fontWeight: 'bold'
                },
                icon: {
                    url: this.getMarkerIcon(index),
                    scaledSize: new google.maps.Size(40, 40)
                },
                animation: google.maps.Animation.DROP,
                zIndex: 999 - index
            });

            // 點擊事件
            marker.addListener('click', () => {
                this.showInfoWindow(marker, venue);
                if (onMarkerClick) {
                    onMarkerClick(venue);
                }
            });

            this.markers.push(marker);
        });

        // 調整地圖視野以包含所有標記
        this.fitBounds();
    }

    /**
     * 取得標記圖標 URL（使用 SVG）
     * @param {number} index - 索引
     */
    getMarkerIcon(index) {
        const color = index === 0 ? '#2563eb' : '#10b981';
        const svg = `
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="${color}" stroke="#ffffff" stroke-width="3"/>
                <text x="20" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
                      text-anchor="middle" fill="#ffffff">${index + 1}</text>
            </svg>
        `;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    /**
     * 顯示資訊視窗
     * @param {google.maps.Marker} marker - 標記
     * @param {Object} venue - 店家資料
     */
    showInfoWindow(marker, venue) {
        const content = `
            <div style="min-width: 200px; padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1e293b;">${venue.name}</h3>
                <div style="margin-bottom: 6px;">
                    <span style="color: #f59e0b;">${this.generateStars(venue.rating)}</span>
                    <span style="font-weight: bold; margin-left: 4px;">${venue.rating.toFixed(1)}</span>
                    <span style="color: #64748b; margin-left: 4px;">(${venue.reviewCount})</span>
                </div>
                <div style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
                    📍 ${this.formatDistance(venue.distance)}
                </div>
                ${this.getOpenStatusBadge(venue)}
                <div style="margin-top: 12px;">
                    <button onclick="showVenueDetails('${venue.id}')" style="
                        width: 100%;
                        padding: 8px;
                        background: #2563eb;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 14px;
                    ">查看詳情</button>
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    /**
     * 清除所有店家標記
     */
    clearMarkers() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    }

    /**
     * 調整地圖視野以包含所有標記
     */
    fitBounds() {
        if (this.markers.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        
        // 包含使用者位置
        if (this.userMarker) {
            bounds.extend(this.userMarker.getPosition());
        }

        // 包含所有店家標記
        this.markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });

        this.map.fitBounds(bounds);
        
        // 避免縮放過度
        const listener = google.maps.event.addListener(this.map, 'idle', () => {
            if (this.map.getZoom() > 17) {
                this.map.setZoom(17);
            }
            google.maps.event.removeListener(listener);
        });
    }

    /**
     * 高亮特定標記
     * @param {number} venueId - 店家 ID
     */
    highlightMarker(venueId) {
        // 實現標記高亮效果
        this.markers.forEach((marker, index) => {
            if (marker.title === venueId) {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => marker.setAnimation(null), 2000);
            }
        });
    }

    // ==================== 輔助函數 ====================
    
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '⯨' : '') + 
               '☆'.repeat(emptyStars);
    }

    formatDistance(meters) {
        if (meters < 1000) {
            return Math.round(meters) + ' 公尺';
        } else {
            return (meters / 1000).toFixed(1) + ' 公里';
        }
    }

    getOpenStatusBadge(venue) {
        if (venue.isOpen === true) {
            return '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 12px;">營業中</span>';
        }
        if (venue.isOpen === false) {
            return '<span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 12px;">休息中</span>';
        }
        return '<span style="background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 12px;">營業狀態未知</span>';
    }

    /**
     * 取得地圖中心點
     */
    getCenter() {
        if (!this.map) return null;
        const center = this.map.getCenter();
        return {
            lat: center.lat(),
            lng: center.lng()
        };
    }

    /**
     * 設定地圖中心點
     * @param {Object} position - 位置 {lat, lng}
     */
    setCenter(position) {
        if (this.map) {
            this.map.setCenter(position);
        }
    }
}

// 建立全域 Google Maps 服務實例
const googleMapsService = new GoogleMapsService();
