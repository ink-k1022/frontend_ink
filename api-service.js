// ==================== API 服務層 ====================
// 處理所有與後端的 API 通訊

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.cache = new Map();
    }

    // ==================== 通用 API 請求方法 ====================
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            body = null,
            headers = {},
            params = {},
            useCache = CONFIG.DEV.ENABLE_API_CACHE,
            cacheKey = null
        } = options;

        // 檢查快取
        const finalCacheKey = cacheKey || `${method}:${endpoint}:${JSON.stringify(params)}`;
        if (useCache && method === 'GET') {
            const cached = this.getFromCache(finalCacheKey);
            if (cached) {
                CONFIG.log('從快取取得資料:', finalCacheKey);
                return cached;
            }
        }

        // 建立完整 URL
        const url = CONFIG.getApiUrl(endpoint, params);

        // 設定請求選項
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        try {
            CONFIG.log(`API 請求: ${method} ${url}`);
            
            // 帶超時的 fetch
            const response = await this.fetchWithTimeout(url, fetchOptions, this.timeout);

            // 檢查 HTTP 狀態
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 解析 JSON
            const data = await response.json();
            
            CONFIG.log('API 回應:', data);

            // 儲存到快取
            if (useCache && method === 'GET') {
                this.saveToCache(finalCacheKey, data);
            }

            return data;

        } catch (error) {
            CONFIG.error('API 請求失敗:', error);
            throw error;
        }
    }

    // 帶超時的 fetch
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('請求超時');
            }
            throw error;
        }
    }

    // ==================== 快取管理 ====================
    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // 檢查是否過期
        if (Date.now() - cached.timestamp > CONFIG.APP.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    clearCache() {
        this.cache.clear();
        CONFIG.log('快取已清除');
    }

    // ==================== 店家相關 API ====================
    
    /**
     * 取得周邊店家列表
     * @param {Object} params - 查詢參數
     * @param {number} params.lat - 緯度
     * @param {number} params.lng - 經度
     * @param {number} params.radius - 搜尋半徑（公尺）
     * @param {string} params.category - 分類（可選）
     * @param {number} params.minRating - 最低評分（可選）
     * @param {boolean} params.openNow - 只顯示營業中（可選）
     * @param {number} params.limit - 結果數量限制（可選）
     */
    async getVenues(params) {
        const queryParams = new URLSearchParams();
        
        // 必填參數
        if (!params.lat || !params.lng) {
            throw new Error('缺少必要的位置參數（lat, lng）');
        }
        
        queryParams.append('lat', params.lat);
        queryParams.append('lng', params.lng);
        queryParams.append('radius', params.radius || CONFIG.APP.DEFAULT_RADIUS);
        
        // 可選參數
        if (params.category) queryParams.append('category', params.category);
        if (params.minRating) queryParams.append('minRating', params.minRating);
        if (params.openNow !== undefined) queryParams.append('openNow', params.openNow);
        if (params.limit) queryParams.append('limit', params.limit);

        const endpoint = `${CONFIG.API.ENDPOINTS.GET_VENUES}?${queryParams.toString()}`;
        return await this.request(endpoint);
    }

    /**
     * 搜尋店家
     * @param {Object} searchData - 搜尋資料
     * @param {string} searchData.query - 搜尋關鍵字
     * @param {number} searchData.lat - 緯度
     * @param {number} searchData.lng - 經度
     * @param {number} searchData.radius - 搜尋半徑
     * @param {Object} searchData.filters - 其他篩選條件
     */
    async searchVenues(searchData) {
        return await this.request(CONFIG.API.ENDPOINTS.SEARCH_VENUES, {
            method: 'POST',
            body: searchData,
            useCache: false
        });
    }

    /**
     * 取得單一店家詳情
     * @param {number|string} venueId - 店家 ID
     */
    async getVenueDetail(venueId) {
        return await this.request(CONFIG.API.ENDPOINTS.GET_VENUE_DETAIL, {
            params: { id: venueId }
        });
    }

    // ==================== 使用者相關 API（可選）====================
    
    /**
     * 取得使用者收藏列表
     */
    async getUserFavorites() {
        return await this.request(CONFIG.API.ENDPOINTS.GET_USER_FAVORITES);
    }

    /**
     * 新增收藏
     * @param {number|string} venueId - 店家 ID
     */
    async addFavorite(venueId) {
        return await this.request(CONFIG.API.ENDPOINTS.ADD_FAVORITE, {
            method: 'POST',
            body: { venueId },
            useCache: false
        });
    }

    /**
     * 移除收藏
     * @param {number|string} venueId - 店家 ID
     */
    async removeFavorite(venueId) {
        return await this.request(CONFIG.API.ENDPOINTS.REMOVE_FAVORITE, {
            method: 'DELETE',
            params: { id: venueId },
            useCache: false
        });
    }

    // ==================== 評論相關 API（可選）====================
    
    /**
     * 取得店家評論
     * @param {number|string} venueId - 店家 ID
     */
    async getReviews(venueId) {
        return await this.request(CONFIG.API.ENDPOINTS.GET_REVIEWS, {
            params: { id: venueId }
        });
    }

    /**
     * 新增評論
     * @param {number|string} venueId - 店家 ID
     * @param {Object} reviewData - 評論資料
     * @param {number} reviewData.rating - 評分（1-5）
     * @param {string} reviewData.comment - 評論內容
     */
    async addReview(venueId, reviewData) {
        return await this.request(CONFIG.API.ENDPOINTS.ADD_REVIEW, {
            method: 'POST',
            params: { id: venueId },
            body: reviewData,
            useCache: false
        });
    }
}

// 建立全域 API 服務實例
const apiService = new ApiService();
