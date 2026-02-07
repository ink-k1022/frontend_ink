# 權重驅動型在地服務推薦系統

# 📍 專案簡介

這是一個基於**地理圍欄（Geofencing）**技術的智能搜尋引擎，旨在幫助使用者找到周邊最合適的商家。系統採用**多維權重演算法**，綜合考量「物理距離」與「社會信用（評價）」，為使用者提供個性化的推薦排序。

**🔥 最新版本已支援前後端分離架構與 Google Maps API！**

## 🏗️ 架構說明

本系統採用**前後端分離**架構：

- **前端**: HTML5 + CSS3 + JavaScript (Vanilla JS)
- **地圖服務**: Google Maps JavaScript API
- **後端**: RESTful API（可使用 Node.js, Python 或任何後端技術）
- **資料流**: 前端 → API 服務層 → 後端 API → 資料庫

### 核心特色

- 🎯 **精準定位**：自動感應使用者位置，即時搜尋周邊店家
- 🧠 **智能排序**：動態平衡距離與評價，找到最適合的選擇
- ⚖️ **權重調整**：自由調整優先級，滿足不同場景需求
- 🗺️ **視覺化地圖**：直觀顯示店家位置與相對距離
- 📊 **多維篩選**：支援分類、評分、營業狀態等多重條件

## 🎨 系統特點

### 1. 權重公式邏輯

系統採用以下核心算法計算推薦分數：

```
Score = Wd × 距離分數 + Wr × (評價分數 + 評論數加成)
```

其中：
- **Wd（距離權重）**：優先過濾出半徑範圍內的商家，距離越近權重越高
- **Wr（品質權重）**：根據平均星等、評論數量及近期熱度進行加權排名
- **距離分數**：歸一化處理（0-1），距離越近分數越高
- **評價分數**：星級評分轉換為0-1分數
- **評論數加成**：最高可獲得20%額外加分

### 2. 動態平衡模式

系統提供三種預設模式：

| 模式 | 距離權重 | 評價權重 | 適用場景 |
|------|----------|----------|----------|
| 🚀 距離優先 | 80% | 20% | 緊急需求（加油站、超商） |
| ⚖️ 智能平衡 | 50% | 50% | 一般情況 |
| 🏆 品質優先 | 20% | 80% | 精緻服務（聚餐、美髮） |

## 🚀 快速開始

### 方式一：快速體驗（使用模擬資料）

1. **設定 Google Maps API Key**
   
   編輯 `config.js`，填入您的 Google Maps API Key：
   ```javascript
   GOOGLE_MAPS: {
       API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
   }
   ```

2. **啟用模擬資料模式**
   
   在 `config.js` 中設定：
   ```javascript
   DEV: {
       ENABLE_MOCK_DATA: true  // 使用模擬資料
   }
   ```

3. **開啟應用**
   
   直接在瀏覽器中打開 `index.html` 或使用本地伺服器：
   ```bash
   python -m http.server 8000
   # 訪問 http://localhost:8000
   ```

### 方式二：完整設置（串接後端）

1. **取得 Google Maps API Key**
   
   - 前往 [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - 啟用 Maps JavaScript API
   - 建立 API 金鑰

2. **設定前端配置**
   
   編輯 `config.js`：
   ```javascript
   GOOGLE_MAPS: {
       API_KEY: 'your_actual_api_key'
   },
   API: {
       BASE_URL: 'http://localhost:3000/api'  // 您的後端地址
   },
   DEV: {
       ENABLE_MOCK_DATA: false  // 停用模擬資料
   }
   ```

3. **啟動後端服務**
   
   ```bash
   cd backend-examples/nodejs-express
   npm install
   npm start
   ```

4. **開啟前端**
   
   ```bash
   python -m http.server 8000
   # 訪問 http://localhost:8000
   ```

5. **允許位置權限**
   
   首次使用時，瀏覽器會請求位置權限，請點擊「允許」。

**📖 詳細設置指南**: 請參考 [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

### 系統需求

**前端**
- 現代瀏覽器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- 支援 Geolocation API
- 網路連線（載入 Google Maps）

**後端**（如需串接）
- Node.js 14+ 或 Python 3.8+ 或其他後端平台
- 資料庫（MongoDB, PostgreSQL, MySQL 等）

## 📖 使用指南

### 基本操作

1. **自動定位**
   - 開啟應用後系統會自動請求位置權限
   - 允許後將顯示您當前位置周邊的店家

2. **搜尋店家**
   - 在搜尋框輸入關鍵字（如「咖啡」、「餐廳」）
   - 點擊搜尋按鈕或按 Enter 鍵

3. **分類篩選**
   - 點擊分類標籤快速篩選特定類型店家
   - 支援：餐廳、咖啡廳、便利商店、加油站、美髮、藥局等

4. **調整權重**
   - 拖動「距離權重」和「評價權重」滑桿
   - 或使用快速模式按鈕一鍵切換

5. **進階篩選**
   - 搜尋半徑：500m - 5km
   - 最低評分：3星 - 4.5星
   - 僅顯示營業中的店家

6. **查看詳情**
   - 點擊結果卡片或地圖標記查看店家詳細資訊
   - 支援導航、分享等功能

### 地圖操作

- 🎯 **定位按鈕**：重新定位到當前位置
- 🔄 **刷新按鈕**：重新載入周邊店家資料
- 🗺️ **地圖互動**：拖動、縮放、點擊標記

## 🏗️ 技術架構

### 技術架構

**前端技術**

| 技術 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 結構與語義化標籤 |
| CSS3 | - | 樣式與響應式設計 |
| JavaScript (ES6+) | - | 業務邏輯與互動 |
| Google Maps API | - | 地圖視覺化與定位 |
| Google Fonts | - | Noto Sans TC 字型 |

**後端技術**（範例）

| 技術 | 版本 | 用途 |
|------|------|------|
| Node.js | 14+ | 伺服器環境 |
| Express | 4.18+ | Web 框架 |
| MongoDB/PostgreSQL | - | 資料庫 |
| RESTful API | - | API 架構 |

### 專案結構

```
local-service-recommender/
├── frontend/                          # 前端文件
│   ├── index.html                    # 主要 HTML 文件
│   ├── styles.css                    # 樣式表
│   ├── config.js                     # 配置文件 ⭐
│   ├── api-service.js                # API 服務層
│   ├── google-maps-service.js        # Google Maps 服務層
│   ├── app-refactored.js             # 主應用程式（重構版）
│   ├── demo.html                     # 演示頁面
│   └── .env.example                  # 環境變數範例
│
├── backend-examples/                  # 後端範例
│   └── nodejs-express/
│       ├── server.js                 # Express 伺服器
│       ├── package.json              # NPM 配置
│       └── README.md                 # 後端說明
│
├── docs/                              # 文檔
│   ├── README.md                     # 專案說明（本文件）
│   ├── BACKEND_API_SPEC.md          # 後端 API 規格
│   ├── INTEGRATION_GUIDE.md         # 前後端整合指南 ⭐
│   ├── QUICKSTART.md                # 快速開始指南
│   └── PROJECT_SUMMARY.txt          # 專案總結
│
└── legacy/                            # 舊版本（Leaflet.js）
    ├── app.js                        # 舊版主程式
    └── index-old.html                # 舊版 HTML
```

### 核心模組

**前端架構**

1. **配置層** (`config.js`)
   - Google Maps API 配置
   - 後端 API 端點配置
   - 應用程式設定
   - 開發模式設定

2. **服務層**
   - `api-service.js`: 處理所有後端 API 通訊
   - `google-maps-service.js`: 處理 Google Maps 相關功能

3. **應用層** (`app-refactored.js`)
   - 使用者介面邏輯
   - 事件處理
   - 狀態管理
   - 權重計算演算法

**後端架構**（範例）

1. **API 端點**
   - GET `/api/venues` - 取得周邊店家
   - POST `/api/venues/search` - 搜尋店家
   - GET `/api/venues/:id` - 取得店家詳情

2. **資料處理**
   - Haversine 距離計算
   - 營業狀態判斷
   - 資料篩選與排序

3. **資料庫操作**
   - 地理空間查詢
   - 索引優化
   - 快取機制

## 🎯 核心演算法詳解

### Haversine 距離計算

```javascript
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
```

### 權重計算範例

假設有以下兩家店：

**店家 A**
- 距離：200m → 歸一化分數：0.9
- 評分：4.0★ → 歸一化分數：0.8
- 評論數：100則 → 加成：0.04

**店家 B**
- 距離：800m → 歸一化分數：0.2
- 評分：4.8★ → 歸一化分數：0.96
- 評論數：500則 → 加成：0.2

使用**平衡模式**（Wd=0.5, Wr=0.5）計算：

- **店家 A 分數** = 0.5 × 0.9 + 0.5 × (0.8 + 0.04) = 0.45 + 0.42 = **0.87** (87分)
- **店家 B 分數** = 0.5 × 0.2 + 0.5 × (0.96 + 0.2) = 0.1 + 0.58 = **0.68** (68分)

→ 店家 A 排名較高

使用**品質優先模式**（Wd=0.2, Wr=0.8）：

- **店家 A 分數** = 0.2 × 0.9 + 0.8 × (0.8 + 0.04) = 0.18 + 0.672 = **0.852** (85分)
- **店家 B 分數** = 0.2 × 0.2 + 0.8 × (0.96 + 0.2) = 0.04 + 0.928 = **0.968** (97分)

→ 店家 B 排名較高

## 🎨 UI/UX 設計原則

### 視覺層級

1. **主要操作**：大型按鈕、明顯色彩對比
2. **次要資訊**：中等字重、柔和色調
3. **輔助內容**：小字體、灰階處理

### 互動反饋

- ✅ **即時反饋**：滑桿拖動即時更新結果
- ✅ **視覺提示**：懸停效果、選中狀態
- ✅ **動畫過渡**：平滑的狀態切換
- ✅ **錯誤處理**：友善的錯誤訊息

### 響應式設計

- 📱 **手機版**：單欄布局，下方滑出式結果面板
- 💻 **平板版**：兩欄布局，保留核心功能
- 🖥️ **桌面版**：三欄布局，完整功能展示

## 🔧 自定義與擴展

### 添加新的店家分類

在 `getCategoryName` 函數中添加新分類：

```javascript
const categories = {
    'restaurant': '🍽️ 餐廳',
    'cafe': '☕ 咖啡廳',
    'your-category': '🎨 您的分類',
    // ...
};
```

### 調整權重公式

修改 `calculateScore` 函數以實現自定義邏輯：

```javascript
function calculateScore(venue) {
    // 您的自定義計算邏輯
    const score = yourCustomFormula(venue);
    return score * 100;
}
```

### 整合真實 API

替換 `loadMockData` 函數：

```javascript
async function loadRealData() {
    try {
        const response = await fetch('YOUR_API_ENDPOINT');
        venues = await response.json();
        updateResults();
    } catch (error) {
        console.error('載入失敗:', error);
    }
}
```

## 📊 資料格式

### Venue 物件結構

```javascript
{
    id: 1,                          // 唯一識別碼
    name: "店家名稱",               // 店家名稱
    category: "restaurant",          // 分類
    lat: 25.0330,                   // 緯度
    lng: 121.5654,                  // 經度
    rating: 4.5,                    // 評分（0-5）
    reviewCount: 328,               // 評論數
    isOpen: true,                   // 營業狀態
    address: "完整地址",            // 地址
    phone: "02-1234-5678",          // 電話
    hours: "營業時間描述"           // 營業時間
}
```

## 🌟 未來規劃

### 短期目標

- [ ] 整合 Google Places API 獲取真實店家資料
- [ ] 添加使用者評論與評分功能
- [ ] 支援多語言切換（英文、日文）
- [ ] 離線模式支援

### 長期目標

- [ ] 個人化推薦（基於歷史記錄）
- [ ] 社交分享功能
- [ ] 路線規劃整合
- [ ] 優惠券與促銷資訊
- [ ] 機器學習優化推薦演算法

## 📝 授權

本專案採用 MIT 授權條款。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 貢獻指南

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📧 聯絡方式

如有任何問題或建議，歡迎聯繫專案維護者。

---

**💡 提示**：首次使用建議開啟位置權限以獲得最佳體驗！
