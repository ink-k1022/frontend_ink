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
        // 必填參數
        if (!params.lat || !params.lng) {
            throw new Error('缺少必要的位置參數（lat, lng）');
        }

        // 使用 Google Places API（透過後端）
        const body = {
            lat: params.lat,
            lng: params.lng,
            radius_m: params.radius || CONFIG.APP.DEFAULT_RADIUS,
            max_result_count: Math.min(params.limit || CONFIG.APP.MAX_RESULTS, 20)
        };

        if (params.category) {
            body.included_types = [this.mapCategoryToPlaceType(params.category)];
        }

        const response = await this.request(CONFIG.API.ENDPOINTS.PLACES_NEARBY, {
            method: 'POST',
            body,
            useCache: false
        });

        return this.normalizePlacesResponse(response);
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
        const response = await this.getVenues({
            lat: searchData.lat,
            lng: searchData.lng,
            radius: searchData.radius,
            category: searchData.filters?.category,
            limit: CONFIG.APP.MAX_RESULTS
        });

        if (!response.success || !Array.isArray(response.data)) {
            return response;
        }

        const query = (searchData.query || '').toLowerCase();
        const filtered = response.data.filter(v => v.name.toLowerCase().includes(query));

        return {
            success: true,
            data: filtered
        };
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

    // ==================== Places 回應轉換 ====================
    normalizePlacesResponse(response) {
        const places = response?.data?.places || [];
        const venues = places
            .map(place => this.normalizePlace(place))
            .filter(v => v && v.lat !== null && v.lng !== null);

        return {
            success: true,
            data: venues
        };
    }

    /**
     * 正規化 services/search API 回應
     */
    normalizeServicesResponse(response) {
        if (!response || !response.success) {
            return { success: false, data: [] };
        }

        const services = response.data || [];
        const venues = services.map(service => this.normalizeService(service));

        return {
            success: true,
            data: venues
        };
    }

    /**
     * 正規化單一服務資料
     */
    normalizeService(service) {
        const location = service.location || {};
        
        return {
            id: service.id || `service_${Date.now()}`,
            name: service.name || '未知店家',
            category: this.mapServiceCategoryToFrontend(service.category),
            lat: location.latitude,
            lng: location.longitude,
            rating: service.rating || 0,
            reviewCount: service.reviews_count || 0,
            isOpen: true, // services API 沒有提供營業狀態
            address: service.address || '',
            phone: service.phone || '',
            hours: service.opening_hours || '營業時間未知',
            distance: service.distance || 0
        };
    }

    normalizePlace(place) {
        if (!place) return null;

        const location = place.location || {};
        const lat = typeof location.latitude === 'number' ? location.latitude : null;
        const lng = typeof location.longitude === 'number' ? location.longitude : null;
        const category = this.mapPlaceToCategory(place);

        return {
            id: place.id || place.name || `${lat},${lng}`,
            name: place.displayName?.text || '未知店家',
            category: category,
            lat,
            lng,
            rating: typeof place.rating === 'number' ? place.rating : 0,
            reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
            isOpen: place.currentOpeningHours?.openNow ?? null,
            address: place.formattedAddress || '',
            phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
            hours: place.currentOpeningHours
                ? (place.currentOpeningHours.openNow ? '營業中' : '休息中')
                : '營業時間未知'
        };
    }

    mapCategoryToPlaceType(category) {
        const mapping = {
            restaurant: 'restaurant',
            cafe: 'cafe',
            convenience: 'convenience_store',
            gas: 'gas_station',
            salon: 'beauty_salon',
            pharmacy: 'pharmacy',
            bakery: 'bakery',
            gym: 'gym',
            bookstore: 'book_store'
        };
        return mapping[category] || category;
    }

    mapPlaceToCategory(place) {
        const mapping = {
            restaurant: 'restaurant',
            cafe: 'cafe',
            convenience_store: 'convenience',
            gas_station: 'gas',
            beauty_salon: 'salon',
            hair_care: 'salon',
            pharmacy: 'pharmacy',
            bakery: 'bakery',
            gym: 'gym',
            book_store: 'bookstore'
        };

        const candidates = [
            place.primaryType,
            ...(Array.isArray(place.types) ? place.types : [])
        ].filter(Boolean);

        for (const type of candidates) {
            if (mapping[type]) return mapping[type];
        }

        return candidates[0] || 'other';
    }

    /**
     * 將前端分類對應到後端 services API 的分類
     */
    mapCategoryToServiceCategory(category) {
        const mapping = {
            restaurant: '餐廳',
            cafe: '咖啡廳',
            convenience: '便利商店',
            gas: '加油站',
            salon: '美容美髮',
            pharmacy: '藥局',
            bakery: '烘焙坊',
            gym: '健身房',
            bookstore: '書店'
        };
        return mapping[category] || '餐廳'; // 預設為餐廳
    }

    /**
     * 將後端 services API 的分類對應回前端分類
     */
    mapServiceCategoryToFrontend(serviceCategory) {
        const mapping = {
            '餐廳': 'restaurant',
            '咖啡廳': 'cafe',
            '便利商店': 'convenience',
            '加油站': 'gas',
            '美容美髮': 'salon',
            '藥局': 'pharmacy',
            '烘焙坊': 'bakery',
            '健身房': 'gym',
            '書店': 'bookstore'
        };
        return mapping[serviceCategory] || 'restaurant';
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
