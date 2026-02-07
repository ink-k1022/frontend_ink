# Node.js + Express 後端範例

這是一個使用 Node.js 和 Express 實作的後端 API 範例。

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動伺服器

```bash
# 生產模式
npm start

# 開發模式（自動重啟）
npm run dev
```

伺服器將運行於 `http://localhost:3000`

## 📁 專案結構

```
nodejs-express/
├── server.js          # 主要伺服器文件
├── package.json       # 專案配置
└── README.md         # 本文件
```

## 🔧 API 端點

### 基本資訊
- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`

### 可用端點

1. **GET /api/venues** - 取得周邊店家列表
2. **POST /api/venues/search** - 搜尋店家
3. **GET /api/venues/:id** - 取得單一店家詳情
4. **GET /api/venues/:id/reviews** - 取得店家評論

詳細 API 規格請參考 `BACKEND_API_SPEC.md`

## 🧪 測試 API

使用 curl 測試：

```bash
# 取得周邊店家
curl "http://localhost:3000/api/venues?lat=25.0330&lng=121.5654&radius=1000"

# 搜尋店家
curl -X POST http://localhost:3000/api/venues/search \
  -H "Content-Type: application/json" \
  -d '{"query":"咖啡","lat":25.0330,"lng":121.5654,"radius":2000}'

# 取得店家詳情
curl http://localhost:3000/api/venues/1
```

## 📊 資料庫整合

此範例使用模擬資料。實際應用中，建議整合：

- **MongoDB**: 使用 `mongoose`
- **PostgreSQL**: 使用 `pg` 或 `sequelize`
- **MySQL**: 使用 `mysql2` 或 `sequelize`

### MongoDB 範例

```javascript
const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    name: String,
    category: String,
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number] // [lng, lat]
    },
    rating: Number,
    reviewCount: Number
});

// 建立地理空間索引
venueSchema.index({ location: '2dsphere' });

const Venue = mongoose.model('Venue', venueSchema);

// 查詢周邊店家
app.get('/api/venues', async (req, res) => {
    const venues = await Venue.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: radius
            }
        }
    });
    // ...
});
```

## 🔐 安全性建議

1. **CORS 設定**: 限制允許的來源
```javascript
app.use(cors({
    origin: 'https://your-frontend-domain.com'
}));
```

2. **速率限制**: 使用 `express-rate-limit`
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100 // 最多 100 次請求
});
app.use('/api/', limiter);
```

3. **輸入驗證**: 使用 `joi` 或 `express-validator`
4. **環境變數**: 使用 `.env` 文件管理敏感資訊

## 📈 效能優化

1. **快取**: 使用 Redis 快取查詢結果
2. **分頁**: 實作分頁機制
3. **索引**: 在資料庫建立適當的索引
4. **壓縮**: 使用 `compression` 中介軟體

## 🐛 除錯

啟用詳細日誌：

```javascript
const morgan = require('morgan');
app.use(morgan('combined'));
```

## 📝 授權

MIT License
