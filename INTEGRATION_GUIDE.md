# 前後端整合指南

## 📋 目錄

1. [快速開始](#快速開始)
2. [前端配置](#前端配置)
3. [後端設置](#後端設置)
4. [Google Maps API 設定](#google-maps-api-設定)
5. [部署指南](#部署指南)
6. [常見問題](#常見問題)

---

## 🚀 快速開始

### 前置需求

- **前端**: 現代瀏覽器（Chrome 90+, Firefox 88+, Safari 14+）
- **後端**: Node.js 14+ 或 Python 3.8+
- **Google Maps API Key**
- **網路連線**

### 完整流程（5分鐘設置）

```bash
# 1. 取得 Google Maps API Key
# 前往 https://console.cloud.google.com/google/maps-apis

# 2. 配置前端
cp .env.example .env
# 編輯 .env 文件，填入您的 API Key

# 3. 修改 config.js
# 將 GOOGLE_MAPS_API_KEY 和 API_BASE_URL 改為您的實際值

# 4. 啟動後端（以 Node.js 為例）
cd backend-examples/nodejs-express
npm install
npm start

# 5. 開啟前端
# 直接開啟 index.html 或使用本地伺服器
python -m http.server 8000
```

---

## 🎨 前端配置

### 步驟 1: 設定 Google Maps API Key

編輯 `config.js` 文件：

```javascript
const CONFIG = {
    GOOGLE_MAPS: {
        API_KEY: 'YOUR_ACTUAL_API_KEY_HERE', // ← 在這裡填入您的 API Key
        // ...
    }
};
```

### 步驟 2: 設定後端 API 地址

```javascript
const CONFIG = {
    API: {
        BASE_URL: 'http://your-backend-server.com/api', // ← 修改為您的後端地址
        // ...
    }
};
```

### 步驟 3: 調整其他設定（可選）

```javascript
const CONFIG = {
    APP: {
        DEFAULT_RADIUS: 1000,        // 預設搜尋半徑
        DEFAULT_MIN_RATING: 4.0,     // 預設最低評分
        MAX_RESULTS: 50,             // 最大結果數
        // ...
    }
};
```

### 步驟 4: 啟用/停用模擬資料

開發階段如果後端尚未完成，可以啟用模擬資料：

```javascript
const CONFIG = {
    DEV: {
        ENABLE_MOCK_DATA: true,  // ← 設為 true 使用模擬資料
        // ...
    }
};
```

---

## 🔧 後端設置

### 選項 1: Node.js + Express

```bash
cd backend-examples/nodejs-express
npm install
npm start
```

伺服器將運行於 `http://localhost:3000`

### 選項 2: 整合到現有後端

#### 必須實作的 API 端點

1. **GET /api/venues** - 取得周邊店家列表
2. **POST /api/venues/search** - 搜尋店家
3. **GET /api/venues/:id** - 取得店家詳情

詳細規格請參考 [BACKEND_API_SPEC.md](BACKEND_API_SPEC.md)

#### 回應格式範例

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
            "address": "完整地址",
            "phone": "02-1234-5678",
            "hours": "營業時間"
        }
    ],
    "message": "成功取得資料",
    "timestamp": "2026-02-07T14:30:00Z"
}
```

### 重要：設定 CORS

確保後端允許前端域名的跨域請求：

```javascript
// Node.js + Express
const cors = require('cors');
app.use(cors({
    origin: 'https://your-frontend-domain.com'
}));
```

---

## 🗺️ Google Maps API 設定

### 步驟 1: 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案或選擇現有專案

### 步驟 2: 啟用 Maps JavaScript API

1. 在左側選單選擇「API 和服務」→「程式庫」
2. 搜尋「Maps JavaScript API」
3. 點擊「啟用」

### 步驟 3: 建立 API 金鑰

1. 選擇「API 和服務」→「憑證」
2. 點擊「建立憑證」→「API 金鑰」
3. 複製生成的 API 金鑰

### 步驟 4: 限制 API 金鑰（建議）

為了安全性，建議限制 API 金鑰的使用：

#### 應用程式限制
- **HTTP 參照網址**: 限制只能從您的網域使用
  ```
  https://your-domain.com/*
  http://localhost:8000/*  （開發用）
  ```

#### API 限制
- 只勾選「Maps JavaScript API」

### 步驟 5: 設定計費（必要）

Google Maps API 需要啟用計費帳戶，但提供每月 $200 USD 的免費額度。

免費額度包含：
- 28,000 次地圖載入
- 40,000 次地理編碼請求

---

## 📂 專案結構

```
project-root/
├── frontend/                    # 前端文件
│   ├── index.html              # 主頁面
│   ├── styles.css              # 樣式表
│   ├── config.js               # 配置文件 ⭐
│   ├── api-service.js          # API 服務層
│   ├── google-maps-service.js  # Google Maps 服務層
│   ├── app-refactored.js       # 主應用程式
│   └── .env.example            # 環境變數範例
│
├── backend-examples/            # 後端範例
│   └── nodejs-express/
│       ├── server.js           # Express 伺服器
│       ├── package.json
│       └── README.md
│
└── docs/                        # 文檔
    ├── BACKEND_API_SPEC.md     # API 規格文檔
    ├── INTEGRATION_GUIDE.md    # 本文件
    └── README.md               # 專案說明
```

---

## 🔄 資料流程

```
使用者操作
    ↓
前端 (app-refactored.js)
    ↓
API 服務層 (api-service.js)
    ↓
HTTP 請求
    ↓
後端 API (server.js)
    ↓
資料庫查詢
    ↓
回應 JSON 資料
    ↓
前端處理資料
    ↓
Google Maps 服務層 (google-maps-service.js)
    ↓
更新地圖標記
    ↓
更新結果列表
```

---

## 🚀 部署指南

### 前端部署

#### 選項 1: GitHub Pages

1. 推送代碼到 GitHub
2. 到 Settings → Pages
3. 選擇分支並儲存
4. 訪問 `https://username.github.io/repository-name`

#### 選項 2: Netlify

1. 連接 GitHub 倉庫
2. 設定環境變數
3. 自動部署

#### 選項 3: Vercel

```bash
npm install -g vercel
vercel
```

### 後端部署

#### 選項 1: Heroku

```bash
# 安裝 Heroku CLI
heroku create your-app-name
git push heroku main
```

#### 選項 2: AWS EC2

1. 啟動 EC2 實例
2. 安裝 Node.js
3. 使用 PM2 管理進程

```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

#### 選項 3: Docker

```dockerfile
FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔍 測試整合

### 1. 測試後端 API

```bash
# 測試取得店家列表
curl "http://localhost:3000/api/venues?lat=25.0330&lng=121.5654&radius=1000"

# 應該返回 JSON 格式的店家資料
```

### 2. 測試前端串接

1. 開啟瀏覽器開發者工具（F12）
2. 切換到 Console 標籤
3. 開啟應用程式
4. 檢查是否有錯誤訊息
5. 切換到 Network 標籤查看 API 請求

### 3. 常見檢查點

✅ Google Maps 是否正確載入  
✅ API 請求是否成功（狀態碼 200）  
✅ CORS 錯誤是否已解決  
✅ 店家標記是否正確顯示  
✅ 距離計算是否正確  

---

## ❓ 常見問題

### Q1: Google Maps 無法顯示

**原因**: API Key 無效或未啟用 Maps JavaScript API

**解決**:
1. 檢查 `config.js` 中的 API Key 是否正確
2. 確認已在 Google Cloud Console 啟用 Maps JavaScript API
3. 檢查 API Key 的限制設定

### Q2: CORS 錯誤

**錯誤訊息**: 
```
Access to fetch at 'http://localhost:3000/api/venues' from origin 'http://localhost:8000' 
has been blocked by CORS policy
```

**解決**:
後端添加 CORS 設定：
```javascript
app.use(cors({
    origin: 'http://localhost:8000'
}));
```

### Q3: API 請求失敗

**檢查步驟**:
1. 後端伺服器是否正在運行
2. API 地址是否正確（檢查 `config.js`）
3. 網路連線是否正常
4. 查看瀏覽器 Console 的錯誤訊息

### Q4: 找不到店家資料

**可能原因**:
1. 搜尋半徑太小
2. 篩選條件太嚴格
3. 資料庫中沒有該區域的店家

**解決**:
1. 增加搜尋半徑
2. 降低最低評分要求
3. 檢查資料庫資料

### Q5: 距離計算不準確

**原因**: 使用簡單的直線距離計算

**改善**: 使用 Google Maps Distance Matrix API 取得實際路線距離

---

## 📞 技術支援

如遇到問題：

1. 檢查瀏覽器 Console 的錯誤訊息
2. 查看後端日誌
3. 參考 `BACKEND_API_SPEC.md` 確認 API 格式
4. 啟用 `CONFIG.DEV.ENABLE_CONSOLE_LOG = true` 查看詳細日誌

---

## 🎓 下一步

- 整合真實的店家資料（如 Google Places API）
- 實作使用者帳號系統
- 添加收藏與評論功能
- 優化效能與快取機制
- 實作 PWA 離線支援

---

**祝您整合順利！** 🎉
