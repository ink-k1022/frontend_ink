# 後端 API 規格文檔

## 📋 概述

本文檔定義了智能在地服務推薦系統的後端 API 規格。前端會根據此規格呼叫後端服務。

## 🔧 基本資訊

- **Base URL**: `http://your-server.com/api`
- **Content-Type**: `application/json`
- **字符編碼**: `UTF-8`

## 📊 標準回應格式

所有 API 回應都應遵循以下格式：

### 成功回應
```json
{
    "success": true,
    "data": {},          // 或 []
    "message": "操作成功",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

### 錯誤回應
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "錯誤訊息",
        "details": {}
    },
    "timestamp": "2026-02-07T14:30:00Z"
}
```

## 🏪 店家相關 API

### 1. 取得周邊店家列表

**請求**
```
GET /api/venues
```

**Query 參數**

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| lat | number | ✅ | 使用者緯度 | 25.0330 |
| lng | number | ✅ | 使用者經度 | 121.5654 |
| radius | number | ✅ | 搜尋半徑（公尺） | 1000 |
| category | string | ❌ | 店家分類 | restaurant |
| minRating | number | ❌ | 最低評分（0-5） | 4.0 |
| openNow | boolean | ❌ | 只顯示營業中 | true |
| limit | number | ❌ | 結果數量限制 | 50 |

**回應範例**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "星巴克信義旗艦店",
            "category": "cafe",
            "lat": 25.0350,
            "lng": 121.5664,
            "rating": 4.5,
            "reviewCount": 328,
            "isOpen": true,
            "distance": 250.5,
            "address": "台北市信義區信義路五段7號",
            "phone": "02-2345-6789",
            "hours": "週一至週日 07:00 - 22:00",
            "priceLevel": 2,
            "images": [
                "https://example.com/image1.jpg"
            ]
        }
    ],
    "message": "成功取得 15 筆店家資料",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

**店家物件欄位說明**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | number/string | ✅ | 店家唯一識別碼 |
| name | string | ✅ | 店家名稱 |
| category | string | ✅ | 店家分類（見分類列表） |
| lat | number | ✅ | 緯度 |
| lng | number | ✅ | 經度 |
| rating | number | ✅ | 平均評分（0-5） |
| reviewCount | number | ✅ | 評論總數 |
| isOpen | boolean | ✅ | 是否營業中 |
| distance | number | ✅ | 距離使用者的距離（公尺） |
| address | string | ❌ | 地址 |
| phone | string | ❌ | 電話 |
| hours | string | ❌ | 營業時間 |
| priceLevel | number | ❌ | 價格等級（1-4） |
| images | array | ❌ | 圖片 URL 陣列 |

---

### 2. 搜尋店家

**請求**
```
POST /api/venues/search
```

**Request Body**
```json
{
    "query": "咖啡",
    "lat": 25.0330,
    "lng": 121.5654,
    "radius": 2000,
    "filters": {
        "category": "cafe",
        "minRating": 4.0,
        "openNow": true,
        "priceLevel": [1, 2]
    }
}
```

**Body 參數說明**

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| query | string | ✅ | 搜尋關鍵字 |
| lat | number | ✅ | 使用者緯度 |
| lng | number | ✅ | 使用者經度 |
| radius | number | ✅ | 搜尋半徑（公尺） |
| filters | object | ❌ | 篩選條件 |
| filters.category | string | ❌ | 分類篩選 |
| filters.minRating | number | ❌ | 最低評分 |
| filters.openNow | boolean | ❌ | 只顯示營業中 |
| filters.priceLevel | array | ❌ | 價格等級篩選 |

**回應格式**

與「取得周邊店家列表」相同

---

### 3. 取得單一店家詳情

**請求**
```
GET /api/venues/:id
```

**Path 參數**

| 參數 | 類型 | 說明 |
|------|------|------|
| id | number/string | 店家 ID |

**回應範例**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "星巴克信義旗艦店",
        "category": "cafe",
        "lat": 25.0350,
        "lng": 121.5664,
        "rating": 4.5,
        "reviewCount": 328,
        "isOpen": true,
        "distance": 250.5,
        "address": "台北市信義區信義路五段7號",
        "phone": "02-2345-6789",
        "hours": "週一至週日 07:00 - 22:00",
        "priceLevel": 2,
        "images": [
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg"
        ],
        "description": "星巴克旗艦店，提供優質咖啡與舒適環境",
        "amenities": ["wifi", "outdoor_seating", "parking"],
        "website": "https://www.starbucks.com.tw",
        "openingHours": {
            "monday": "07:00-22:00",
            "tuesday": "07:00-22:00",
            "wednesday": "07:00-22:00",
            "thursday": "07:00-22:00",
            "friday": "07:00-22:00",
            "saturday": "08:00-23:00",
            "sunday": "08:00-23:00"
        }
    },
    "message": "成功取得店家詳情",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

---

## 👤 使用者相關 API（可選）

### 4. 取得使用者收藏列表

**請求**
```
GET /api/user/favorites
```

**Headers**
```
Authorization: Bearer {token}
```

**回應範例**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "venueId": 123,
            "venue": {
                "id": 123,
                "name": "星巴克信義旗艦店",
                "category": "cafe",
                "rating": 4.5
            },
            "createdAt": "2026-02-01T10:00:00Z"
        }
    ],
    "message": "成功取得收藏列表",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

---

### 5. 新增收藏

**請求**
```
POST /api/user/favorites
```

**Headers**
```
Authorization: Bearer {token}
```

**Request Body**
```json
{
    "venueId": 123
}
```

**回應範例**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "venueId": 123,
        "createdAt": "2026-02-07T14:30:00Z"
    },
    "message": "成功新增收藏",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

---

### 6. 移除收藏

**請求**
```
DELETE /api/user/favorites/:id
```

**Headers**
```
Authorization: Bearer {token}
```

**回應範例**
```json
{
    "success": true,
    "data": null,
    "message": "成功移除收藏",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

---

## 💬 評論相關 API（可選）

### 7. 取得店家評論

**請求**
```
GET /api/venues/:id/reviews
```

**Query 參數**

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | number | ❌ | 頁碼（預設 1） |
| limit | number | ❌ | 每頁數量（預設 10） |
| sort | string | ❌ | 排序方式（newest/highest/lowest） |

**回應範例**
```json
{
    "success": true,
    "data": {
        "reviews": [
            {
                "id": 1,
                "userId": 456,
                "userName": "王小明",
                "userAvatar": "https://example.com/avatar.jpg",
                "rating": 5,
                "comment": "咖啡很好喝，環境舒適！",
                "images": ["https://example.com/review1.jpg"],
                "createdAt": "2026-02-05T10:00:00Z",
                "helpful": 12
            }
        ],
        "pagination": {
            "total": 328,
            "page": 1,
            "limit": 10,
            "totalPages": 33
        }
    },
    "message": "成功取得評論",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

---

### 8. 新增評論

**請求**
```
POST /api/venues/:id/reviews
```

**Headers**
```
Authorization: Bearer {token}
```

**Request Body**
```json
{
    "rating": 5,
    "comment": "咖啡很好喝，環境舒適！",
    "images": ["base64_encoded_image"]
}
```

**回應範例**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "venueId": 123,
        "userId": 456,
        "rating": 5,
        "comment": "咖啡很好喝，環境舒適！",
        "createdAt": "2026-02-07T14:30:00Z"
    },
    "message": "成功新增評論",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

---

## 📋 店家分類列表

```javascript
const CATEGORIES = {
    'restaurant': '餐廳',
    'cafe': '咖啡廳',
    'convenience': '便利商店',
    'gas': '加油站',
    'salon': '美髮',
    'pharmacy': '藥局',
    'bakery': '烘焙坊',
    'gym': '健身房',
    'bookstore': '書店',
    'supermarket': '超市',
    'bank': '銀行',
    'hospital': '醫院',
    'hotel': '旅館',
    'bar': '酒吧',
    'shopping': '購物'
};
```

---

## ⚠️ 錯誤碼

| 錯誤碼 | HTTP 狀態碼 | 說明 |
|--------|-------------|------|
| INVALID_PARAMS | 400 | 參數錯誤 |
| UNAUTHORIZED | 401 | 未授權 |
| FORBIDDEN | 403 | 無權限 |
| NOT_FOUND | 404 | 資源不存在 |
| RATE_LIMIT | 429 | 請求過於頻繁 |
| SERVER_ERROR | 500 | 伺服器錯誤 |
| SERVICE_UNAVAILABLE | 503 | 服務暫時無法使用 |

---

## 🔒 認證（如需要）

使用 Bearer Token 認證：

```
Authorization: Bearer {your_access_token}
```

---

## 📝 注意事項

1. **距離計算**：後端應使用 Haversine 公式計算距離
2. **營業狀態**：`isOpen` 應根據當前時間和店家營業時間動態計算
3. **分頁**：建議對評論等列表型資料實作分頁
4. **快取**：建議對店家資料實作適當的快取機制
5. **CORS**：確保 API 正確設定 CORS headers
6. **速率限制**：建議實作 API 速率限制防止濫用

---

## 🚀 實作建議

### Node.js + Express 範例

請參考 `backend-examples/nodejs-express/` 資料夾中的範例程式碼。

### Python + Flask/FastAPI 範例

請參考 `backend-examples/python-flask/` 資料夾中的範例程式碼。

### 資料庫設計

請參考 `DATABASE_SCHEMA.md` 文件。
