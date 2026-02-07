# 故障排除指南

## HTTP 500 錯誤：Missing GOOGLE_MAPS_API_KEY

### 🔍 問題診斷

當您看到以下錯誤時：
```
[Error] Failed to load resource: the server responded with a status of 500
[Error] [App Error] – "API 請求失敗:"
Error: HTTP 500:
```

這是因為後端 API 伺服器缺少 Google Maps API 金鑰配置。

### ✅ 解決方案

#### 方案 1：聯繫後端管理員（推薦）

後端伺服器 `https://scistapi.ryanisyyds.xyz` 需要設定環境變數：

```bash
# 後端需要設定此環境變數
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
```

**後端管理員需要做的事情：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. 建立或取得 Google Maps API 金鑰
3. **【重要】啟用 Places API (New)**
   - 直接連結：https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=980934650995
   - 或前往 API Library 搜尋 "Places API (New)" 並啟用
   - ⚠️ 注意：不是舊版的 "Places API"，而是 "Places API (New)"
4. 在後端伺服器設定環境變數 `GOOGLE_MAPS_API_KEY`
5. 等待 2-5 分鐘讓設定生效
6. 重新啟動後端服務

#### 方案 2：啟用前端模擬資料（臨時方案）

如果後端暫時無法修復，您可以啟用模擬資料模式：

1. 開啟 `frontend/config.js`
2. 修改以下設定：
```javascript
DEV: {
    ENABLE_MOCK_DATA: true,     // 改為 true
    ENABLE_CONSOLE_LOG: true,
    ENABLE_API_CACHE: true
}
```

3. 重新載入網頁

這樣當 API 失敗時會自動使用模擬資料。

#### 方案 3：使用本地後端

參考 `BACKEND_API_SPEC.md` 設置本地後端伺服器：

```bash
# 1. 建立 .env 檔案
cp .env.example .env

# 2. 編輯 .env，填入您的 Google Maps API Key
GOOGLE_MAPS_API_KEY=your_actual_api_key

# 3. 啟動本地後端（需要自行實作或使用範例）
# 詳見 BACKEND_API_SPEC.md
```

4. 修改 `frontend/config.js` 中的 API 地址：
```javascript
API: {
    BASE_URL: 'http://localhost:3000/api',  // 改為本地後端
    // ...
}
```

### 🔧 驗證修復

使用以下命令測試後端 API 是否正常：

```bash
curl -X POST "https://scistapi.ryanisyyds.xyz/api/places/nearby" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 25.0330,
    "lng": 121.5654,
    "radius": 5000
  }'
```

**期望的正確回應：**
```json
{
  "success": true,
  "data": {
    "places": [...]
  }
}
```

**目前的錯誤回應：**
```json
{
  "success": false,
  "error": "HTTPException",
  "message": "Missing GOOGLE_MAPS_API_KEY",
  "details": null
}
```

### 📝 技術細節

- **錯誤代碼**: HTTP 500 Internal Server Error
- **錯誤原因**: 後端 FastAPI 伺服器缺少必要的環境變數
- **影響範圍**: 所有需要查詢附近地點的功能
- **前端 API 呼叫**: `POST /api/places/nearby`
- **後端需求**: `GOOGLE_MAPS_API_KEY` 環境變數

### 🎯 快速測試

確認後端是否配置正確：
```bash
# 測試 1: 檢查 API 端點
curl -X POST "https://scistapi.ryanisyyds.xyz/api/places/nearby" \
  -H "Content-Type: application/json" \
  -d '{"lat":25.0330,"lng":121.5654,"radius":5000}'

# 測試 2: 檢查參數格式
# 正確格式: {"lat": 25.0330, "lng": 121.5654, "radius": 5000}
# 錯誤格式: {"location": {"lat": 25.0330, "lng": 121.5654}, "radius": 5000}
```
