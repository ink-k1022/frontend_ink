// ==================== 環境配置 ====================
const CONFIG = {
    // Google Maps API 配置
    GOOGLE_MAPS: {
        API_KEY: 'AIzaSyAtw2VvByeXq035Pja_GI8Una-eFrken4Y', // 請替換為您的 Google Maps API Key
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
        BASE_URL: 'http://localhost:3000/api', // 後端 API 地址（對應 FastAPI /api）
        ENDPOINTS: {
            // Places API (新版)
            PLACES_NEARBY: '/places/nearby', // POST - 取得附近地點

            // 服務相關
            SERVICES_SEARCH: '/services/search',   // POST - 搜尋服務
            GET_VENUE_DETAIL: '/services/:id',     // GET - 取得服務詳情

            // 評論相關
            GET_REVIEWS: '/reviews/:id',           // GET - 取得評論
            ADD_REVIEW: '/reviews',                // POST - 新增評論

            // 使用者偏好（後端現有 API）
            GET_USER_PREFERENCES: '/user-preferences/:user_id', // GET - 取得偏好
            UPDATE_USER_PREFERENCES: '/user-preferences'        // PUT - 更新偏好

            // 注意：後端目前沒有 favorites 相關端點，如需使用請先擴充後端
        },
        TIMEOUT: 10000, // API 請求超時時間（毫秒）
        RETRY_COUNT: 3  // 失敗重試次數
    },
    
    // 應用程式設定
    APP: {
        DEFAULT_RADIUS: 5000,        // 預設搜尋半徑（公尺）
        DEFAULT_MIN_RATING: 4.0,     // 預設最低評分
        MAX_RESULTS: 20,             // 最大結果數量（Places API 上限 20）
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
