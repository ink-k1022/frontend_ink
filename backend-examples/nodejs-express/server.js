// ==================== Node.js + Express 後端範例 ====================
// 這是一個簡單的範例，展示如何實作 API 端點

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中介軟體設定 ====================
app.use(cors()); // 啟用 CORS
app.use(express.json()); // 解析 JSON body

// ==================== 輔助函數 ====================

/**
 * Haversine 距離計算公式
 */
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

/**
 * 檢查店家是否營業中
 */
function isVenueOpen(venue) {
    // 簡化版本：實際應根據營業時間判斷
    const hour = new Date().getHours();
    return hour >= 8 && hour < 22;
}

/**
 * 標準成功回應
 */
function successResponse(data, message = '操作成功') {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    };
}

/**
 * 標準錯誤回應
 */
function errorResponse(code, message, details = null) {
    return {
        success: false,
        error: {
            code,
            message,
            details
        },
        timestamp: new Date().toISOString()
    };
}

// ==================== 模擬資料庫 ====================
// 實際應使用 MongoDB, PostgreSQL 等資料庫

const mockVenues = [
    {
        id: 1,
        name: '星巴克信義旗艦店',
        category: 'cafe',
        lat: 25.0350,
        lng: 121.5664,
        rating: 4.5,
        reviewCount: 328,
        address: '台北市信義區信義路五段7號',
        phone: '02-2345-6789',
        hours: '週一至週日 07:00 - 22:00',
        priceLevel: 2,
        images: ['https://example.com/image1.jpg']
    },
    {
        id: 2,
        name: '鼎泰豐信義店',
        category: 'restaurant',
        lat: 25.0380,
        lng: 121.5634,
        rating: 4.8,
        reviewCount: 856,
        address: '台北市信義區市府路45號',
        phone: '02-2345-1234',
        hours: '週一至週日 11:00 - 21:30',
        priceLevel: 3,
        images: ['https://example.com/image2.jpg']
    },
    {
        id: 3,
        name: '7-ELEVEN 信義門市',
        category: 'convenience',
        lat: 25.0320,
        lng: 121.5674,
        rating: 4.2,
        reviewCount: 145,
        address: '台北市信義區松智路17號',
        phone: '02-2345-9876',
        hours: '24小時營業',
        priceLevel: 1,
        images: ['https://example.com/image3.jpg']
    }
];

// ==================== API 端點 ====================

/**
 * GET /api/venues
 * 取得周邊店家列表
 */
app.get('/api/venues', (req, res) => {
    try {
        const { lat, lng, radius, category, minRating, openNow, limit } = req.query;
        
        // 驗證必填參數
        if (!lat || !lng || !radius) {
            return res.status(400).json(
                errorResponse('INVALID_PARAMS', '缺少必要參數：lat, lng, radius')
            );
        }
        
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseInt(radius);
        
        // 計算距離並篩選
        let results = mockVenues.map(venue => {
            const distance = calculateDistance(userLat, userLng, venue.lat, venue.lng);
            return {
                ...venue,
                distance,
                isOpen: isVenueOpen(venue)
            };
        });
        
        // 距離篩選
        results = results.filter(v => v.distance <= searchRadius);
        
        // 分類篩選
        if (category) {
            results = results.filter(v => v.category === category);
        }
        
        // 評分篩選
        if (minRating) {
            results = results.filter(v => v.rating >= parseFloat(minRating));
        }
        
        // 營業狀態篩選
        if (openNow === 'true') {
            results = results.filter(v => v.isOpen);
        }
        
        // 依距離排序
        results.sort((a, b) => a.distance - b.distance);
        
        // 限制結果數量
        if (limit) {
            results = results.slice(0, parseInt(limit));
        }
        
        res.json(successResponse(
            results,
            `成功取得 ${results.length} 筆店家資料`
        ));
        
    } catch (error) {
        console.error('取得店家列表失敗:', error);
        res.status(500).json(
            errorResponse('SERVER_ERROR', '伺服器錯誤')
        );
    }
});

/**
 * POST /api/venues/search
 * 搜尋店家
 */
app.post('/api/venues/search', (req, res) => {
    try {
        const { query, lat, lng, radius, filters } = req.body;
        
        // 驗證參數
        if (!query || !lat || !lng || !radius) {
            return res.status(400).json(
                errorResponse('INVALID_PARAMS', '缺少必要參數')
            );
        }
        
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseInt(radius);
        
        // 計算距離
        let results = mockVenues.map(venue => {
            const distance = calculateDistance(userLat, userLng, venue.lat, venue.lng);
            return {
                ...venue,
                distance,
                isOpen: isVenueOpen(venue)
            };
        });
        
        // 距離篩選
        results = results.filter(v => v.distance <= searchRadius);
        
        // 關鍵字搜尋
        const queryLower = query.toLowerCase();
        results = results.filter(v => 
            v.name.toLowerCase().includes(queryLower) ||
            v.category.toLowerCase().includes(queryLower)
        );
        
        // 應用篩選器
        if (filters) {
            if (filters.category) {
                results = results.filter(v => v.category === filters.category);
            }
            if (filters.minRating) {
                results = results.filter(v => v.rating >= filters.minRating);
            }
            if (filters.openNow) {
                results = results.filter(v => v.isOpen);
            }
        }
        
        // 依距離排序
        results.sort((a, b) => a.distance - b.distance);
        
        res.json(successResponse(
            results,
            `搜尋到 ${results.length} 筆結果`
        ));
        
    } catch (error) {
        console.error('搜尋失敗:', error);
        res.status(500).json(
            errorResponse('SERVER_ERROR', '伺服器錯誤')
        );
    }
});

/**
 * GET /api/venues/:id
 * 取得單一店家詳情
 */
app.get('/api/venues/:id', (req, res) => {
    try {
        const venueId = parseInt(req.params.id);
        const venue = mockVenues.find(v => v.id === venueId);
        
        if (!venue) {
            return res.status(404).json(
                errorResponse('NOT_FOUND', '找不到指定的店家')
            );
        }
        
        // 加入額外的詳細資訊
        const detailedVenue = {
            ...venue,
            isOpen: isVenueOpen(venue),
            description: `${venue.name}的詳細描述`,
            amenities: ['wifi', 'parking'],
            website: 'https://example.com',
            openingHours: {
                monday: '09:00-22:00',
                tuesday: '09:00-22:00',
                wednesday: '09:00-22:00',
                thursday: '09:00-22:00',
                friday: '09:00-22:00',
                saturday: '10:00-23:00',
                sunday: '10:00-23:00'
            }
        };
        
        res.json(successResponse(
            detailedVenue,
            '成功取得店家詳情'
        ));
        
    } catch (error) {
        console.error('取得店家詳情失敗:', error);
        res.status(500).json(
            errorResponse('SERVER_ERROR', '伺服器錯誤')
        );
    }
});

/**
 * GET /api/venues/:id/reviews
 * 取得店家評論
 */
app.get('/api/venues/:id/reviews', (req, res) => {
    try {
        const venueId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // 模擬評論資料
        const mockReviews = [
            {
                id: 1,
                userId: 456,
                userName: '王小明',
                userAvatar: 'https://example.com/avatar.jpg',
                rating: 5,
                comment: '咖啡很好喝，環境舒適！',
                images: [],
                createdAt: new Date().toISOString(),
                helpful: 12
            }
        ];
        
        res.json(successResponse({
            reviews: mockReviews,
            pagination: {
                total: mockReviews.length,
                page,
                limit,
                totalPages: Math.ceil(mockReviews.length / limit)
            }
        }, '成功取得評論'));
        
    } catch (error) {
        console.error('取得評論失敗:', error);
        res.status(500).json(
            errorResponse('SERVER_ERROR', '伺服器錯誤')
        );
    }
});

// ==================== 啟動伺服器 ====================
app.listen(PORT, () => {
    console.log(`🚀 伺服器運行於 http://localhost:${PORT}`);
    console.log(`📖 API 文檔: http://localhost:${PORT}/api`);
});

// ==================== 錯誤處理 ====================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json(
        errorResponse('SERVER_ERROR', '伺服器發生錯誤')
    );
});
