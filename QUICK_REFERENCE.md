# 🚀 快速參考卡

## 📋 5分鐘快速設置

### 步驟 1: 取得 Google Maps API Key
```
1. 訪問: https://console.cloud.google.com/google/maps-apis
2. 建立專案 → 啟用 "Maps JavaScript API"
3. 建立憑證 → API 金鑰
4. 複製 API Key
```

### 步驟 2: 配置前端
編輯 `config.js`:
```javascript
GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE',
API_BASE_URL: 'http://localhost:3000/api',
ENABLE_MOCK_DATA: false  // true=測試模式, false=真實模式
```

### 步驟 3: 啟動後端
```bash
cd backend-examples/nodejs-express
npm install
npm start
```

### 步驟 4: 啟動前端
```bash
python -m http.server 8000
# 訪問 http://localhost:8000
```

---

## 📁 關鍵文件位置

| 文件 | 路徑 | 用途 |
|------|------|------|
| **配置** | `config.js` | ⭐ 所有配置在這裡 |
| **前端** | `index.html` | 主頁面 |
| **API 服務** | `api-service.js` | API 通訊層 |
| **地圖服務** | `google-maps-service.js` | Google Maps |
| **後端範例** | `backend-examples/nodejs-express/server.js` | 後端 API |

---

## 🔧 config.js 重要設定

```javascript
const CONFIG = {
    // 1. Google Maps API Key (必填)
    GOOGLE_MAPS: {
        API_KEY: 'YOUR_KEY_HERE'  // ← 改這裡
    },
    
    // 2. 後端 API 地址 (必填)
    API: {
        BASE_URL: 'http://localhost:3000/api'  // ← 改這裡
    },
    
    // 3. 開發模式 (測試時用)
    DEV: {
        ENABLE_MOCK_DATA: false  // true=不呼叫後端
    }
};
```

---

## 🌐 必須實作的後端 API

### 1. GET /api/venues
```javascript
// 查詢參數: lat, lng, radius, category, minRating, openNow
// 回應: { success: true, data: [...] }
```

### 2. POST /api/venues/search
```javascript
// Body: { query, lat, lng, radius, filters }
// 回應: { success: true, data: [...] }
```

### 3. GET /api/venues/:id
```javascript
// 回應: { success: true, data: {...} }
```

**詳細規格**: 見 `BACKEND_API_SPEC.md`

---

## 📊 標準 API 回應格式

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "店家名稱",
            "category": "cafe",
            "lat": 25.0330,
            "lng": 121.5654,
            "rating": 4.5,
            "reviewCount": 328,
            "isOpen": true,
            "distance": 250.5,
            "address": "地址",
            "phone": "電話",
            "hours": "營業時間"
        }
    ],
    "message": "成功",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

---

## 🐛 常見問題快速解決

### Google Maps 不顯示
```bash
# 1. 檢查 config.js 中的 API Key
# 2. 確認已啟用 Maps JavaScript API
# 3. 查看瀏覽器 Console 錯誤
```

### CORS 錯誤
```javascript
// 後端加入:
app.use(cors({
    origin: 'http://localhost:8000'
}));
```

### API 請求失敗
```bash
# 1. 確認後端運行: http://localhost:3000/api/venues?lat=25&lng=121&radius=1000
# 2. 檢查 config.js 的 BASE_URL
# 3. 查看瀏覽器 Network 標籤
```

---

## 📚 文檔速查

| 需求 | 查看文檔 |
|------|----------|
| 整合步驟 | `INTEGRATION_GUIDE.md` ⭐ |
| API 規格 | `BACKEND_API_SPEC.md` ⭐ |
| 部署上線 | `DEPLOYMENT.md` |
| 快速開始 | `QUICKSTART.md` |
| 專案說明 | `README.md` |

---

## 🎯 測試檢查清單

### 前端測試
- [ ] 開啟 index.html
- [ ] Google Maps 正確顯示
- [ ] 允許位置權限
- [ ] 看到周邊店家標記
- [ ] 右側顯示結果列表
- [ ] 點擊店家查看詳情

### 後端測試
```bash
# 測試 API
curl "http://localhost:3000/api/venues?lat=25.0330&lng=121.5654&radius=1000"

# 應該返回 JSON 格式的店家資料
```

### 整合測試
- [ ] 前端能成功呼叫後端 API
- [ ] Network 標籤看到 200 狀態碼
- [ ] 店家資料正確顯示在地圖上
- [ ] 權重調整功能正常
- [ ] 搜尋功能正常

---

## ⚡ 效能優化建議

```javascript
// 1. 啟用快取 (config.js)
ENABLE_API_CACHE: true

// 2. 設定快取時間
CACHE_DURATION: 300000  // 5分鐘

// 3. 限制結果數量
MAX_RESULTS: 50
```

---

## 🚀 部署快速指南

### 前端部署 (Netlify)
```bash
1. 推送代碼到 GitHub
2. 連接 Netlify
3. 設定環境變數
4. 自動部署
```

### 後端部署 (Heroku)
```bash
heroku create your-app
heroku config:set NODE_ENV=production
git push heroku main
```

**詳細步驟**: 見 `DEPLOYMENT.md`

---

## 💡 重要提醒

### Google Maps API
- ✅ 需要啟用計費帳戶
- ✅ 每月 $200 免費額度
- ✅ 建議設定 API Key 限制

### CORS 設定
- ✅ 後端必須設定 CORS
- ✅ 允許前端域名

### 環境變數
- ✅ 不要將 API Key 提交到 Git
- ✅ 使用 .env 文件管理

---

## 📞 需要幫助？

1. 查看對應文檔
2. 檢查瀏覽器 Console
3. 查看後端日誌
4. 啟用除錯模式: `ENABLE_CONSOLE_LOG: true`

---

**立即開始**: 編輯 `config.js` → 啟動後端 → 開啟前端 🎉
