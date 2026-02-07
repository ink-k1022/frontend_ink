// ==================== 環境配置 ====================
const CONFIG = {
    // Google Maps API 配置
    GOOGLE_MAPS: {
        API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY_HERE', // 請替換為您的 Google Maps API Key
        DEFAULT_CENTER: { lat: 25.0330, lng: 121.5654 }, // 預設中心點（台北101）
        DEFAULT_ZOOM: 15,
        MAP_OPTIONS: {
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        }
    },
    
    // 後端 API 配置
    API: {
        BASE_URL: 'http://localhost:3000/api', // 請替換為您的後端 API 地址
        ENDPOINTS: {
            // 店家相關
            GET_VENUES: '/venues',           // GET - 取得店家列表
            GET_VENUE_DETAIL: '/venues/:id', // GET - 取得單一店家詳情
            SEARCH_VENUES: '/venues/search', // POST - 搜尋店家
            
            // 使用者相關（可選）
            GET_USER_FAVORITES: '/user/favorites',    // GET - 取得收藏
            ADD_FAVORITE: '/user/favorites',          // POST - 新增收藏
            REMOVE_FAVORITE: '/user/favorites/:id',   // DELETE - 移除收藏
            
            // 評論相關（可選）
            GET_REVIEWS: '/venues/:id/reviews',       // GET - 取得評論
            ADD_REVIEW: '/venues/:id/reviews'         // POST - 新增評論
        },
        TIMEOUT: 10000, // API 請求超時時間（毫秒）
        RETRY_COUNT: 3  // 失敗重試次數
    },
    
    // 應用程式設定
    APP: {
        DEFAULT_RADIUS: 1000,        // 預設搜尋半徑（公尺）
        DEFAULT_MIN_RATING: 4.0,     // 預設最低評分
        MAX_RESULTS: 50,             // 最大結果數量
        CACHE_DURATION: 300000,      // 快取有效期（5分鐘）
        GEOLOCATION_TIMEOUT: 5000,   // 定位超時時間
        GEOLOCATION_MAX_AGE: 60000   // 定位資料最大使用時間
    },
    
    // 開發模式設定
    DEV: {
        ENABLE_MOCK_DATA: false,     // 是否啟用模擬資料
        ENABLE_CONSOLE_LOG: true,    // 是否顯示 console.log
        ENABLE_API_CACHE: true       // 是否啟用 API 快取
    }
};

// 根據環境自動調整配置
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.DEV.ENABLE_CONSOLE_LOG = true;
} else {
    CONFIG.DEV.ENABLE_CONSOLE_LOG = false;
}

// 輔助函數：取得完整 API URL
CONFIG.getApiUrl = function(endpoint, params = {}) {
    let url = this.API.BASE_URL + endpoint;
    
    // 替換路徑參數（如 :id）
    Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
    });
    
    return url;
};

// 輔助函數：記錄日誌
CONFIG.log = function(...args) {
    if (this.DEV.ENABLE_CONSOLE_LOG) {
        console.log('[App]', ...args);
    }
};

// 輔助函數：記錄錯誤
CONFIG.error = function(...args) {
    console.error('[App Error]', ...args);
};
