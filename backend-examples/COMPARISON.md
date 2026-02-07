# FastAPI vs Node.js/Express 對比

本文檔比較兩種後端實現的差異和特點。

## 技術棧對比

| 特性 | Node.js + Express | Python + FastAPI |
|------|------------------|------------------|
| **語言** | JavaScript | Python |
| **框架** | Express 4.18 | FastAPI 0.109 |
| **運行時** | Node.js | Python 3.8+ |
| **服務器** | Express 內建 | Uvicorn/Gunicorn |
| **異步支持** | 原生 async/await | 原生 async/await |
| **類型系統** | 可選 (TypeScript) | 內建 (Type Hints) |
| **數據驗證** | 手動或第三方庫 | 自動 (Pydantic) |
| **API 文檔** | 需要 Swagger 等工具 | 自動生成 (OpenAPI) |
| **性能** | 優秀 | 優秀 (接近 Node.js) |

## 項目結構對比

### Node.js + Express
```
nodejs-express/
├── server.js          # 單文件實現
├── package.json       # npm 依賴
└── README.md
```

### Python + FastAPI
```
python-fastapi/
├── main.py            # 主應用程序
├── models.py          # 數據模型
├── test_main.py       # 測試文件
├── requirements.txt   # pip 依賴
├── .env.example       # 環境變量範例
├── .gitignore
├── start.sh           # Linux/Mac 啟動腳本
├── start.bat          # Windows 啟動腳本
└── README.md
```

## 代碼對比

### 1. 應用初始化

**Express:**
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
```

**FastAPI:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API 標題", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"])
```

### 2. 路由定義

**Express:**
```javascript
app.post('/api/services/search', (req, res) => {
  const { category, latitude, longitude, radius, max_results } = req.body;
  
  // 需要手動驗證
  if (!category || !latitude || !longitude) {
    return res.status(400).json({ error: '缺少必要參數' });
  }
  
  // 處理邏輯
  res.json({ success: true, data: results });
});
```

**FastAPI:**
```python
@app.post("/api/services/search", response_model=ServiceSearchResponse)
async def search_services(request: ServiceSearchRequest):
    # 自動驗證和解析
    # Pydantic 自動處理數據驗證
    results = filter_and_sort_services(...)
    return {"success": True, "data": results}
```

### 3. 數據模型

**Express:**
```javascript
// 通常不定義嚴格的模型
// 或使用 TypeScript interfaces
```

**FastAPI:**
```python
from pydantic import BaseModel, Field

class ServiceSearchRequest(BaseModel):
    category: str = Field(..., description="服務類別")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius: Optional[int] = Field(5000, gt=0)
```

### 4. 錯誤處理

**Express:**
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服務器錯誤' });
});
```

**FastAPI:**
```python
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "message": str(exc)}
    )
```

## 功能特性對比

### 自動 API 文檔

**Express:**
- ❌ 需要手動配置 Swagger
- ❌ 需要額外的註解和配置
- 🔧 可用工具: swagger-jsdoc, swagger-ui-express

**FastAPI:**
- ✅ 自動生成 OpenAPI 文檔
- ✅ 內建 Swagger UI (`/docs`)
- ✅ 內建 ReDoc (`/redoc`)
- ✅ 從代碼自動推斷模式

### 數據驗證

**Express:**
- ❌ 需要手動驗證
- 🔧 可用庫: joi, express-validator
- ⚠️ 容易遺漏驗證

**FastAPI:**
- ✅ 基於 Pydantic 自動驗證
- ✅ 類型安全
- ✅ 自動生成錯誤消息
- ✅ 支持複雜驗證規則

### 類型系統

**Express:**
- JavaScript: 無類型系統
- TypeScript: 可選類型系統
- ⚠️ 需要額外配置

**FastAPI:**
- ✅ Python 原生類型提示
- ✅ 編輯器自動完成
- ✅ 運行時類型檢查

### 異步處理

**Express:**
```javascript
app.get('/api/data', async (req, res) => {
  const data = await fetchData();
  res.json(data);
});
```

**FastAPI:**
```python
@app.get("/api/data")
async def get_data():
    data = await fetch_data()
    return data
```

兩者都支持異步，語法相似。

## 性能對比

### 基準測試 (相對性能)

| 指標 | Node.js + Express | Python + FastAPI |
|------|------------------|------------------|
| **請求/秒** | ~20,000 | ~18,000 |
| **延遲** | 極低 | 低 |
| **內存使用** | 低 | 中等 |
| **CPU 使用** | 低 | 中等 |

**結論**: 
- Node.js 在純 I/O 操作上略快
- FastAPI 在需要數據驗證的場景下更高效
- 兩者性能都足夠應對大多數應用場景

## 開發體驗

### Node.js + Express
**優點:**
- ✅ 生態系統龐大
- ✅ 社區活躍
- ✅ 前後端同語言
- ✅ 啟動快速

**缺點:**
- ❌ 需要手動處理數據驗證
- ❌ 缺少內建 API 文檔
- ❌ 類型安全需要 TypeScript

### Python + FastAPI
**優點:**
- ✅ 自動 API 文檔
- ✅ 自動數據驗證
- ✅ 類型安全
- ✅ 代碼簡潔
- ✅ 現代 Python 特性

**缺點:**
- ❌ Python 依賴管理相對複雜
- ❌ 部署可能需要更多配置
- ❌ 相比 Node.js 生態系統較小

## 使用場景建議

### 選擇 Node.js + Express 當:
- 前端團隊熟悉 JavaScript
- 需要極致的 I/O 性能
- 需要實時功能 (WebSocket)
- 已有 Node.js 生態系統
- 快速原型開發

### 選擇 Python + FastAPI 當:
- 需要強類型和數據驗證
- 需要自動 API 文檔
- 團隊熟悉 Python
- 需要機器學習整合
- 需要複雜的數據處理
- 重視代碼可維護性

## 遷移指南

### 從 Express 到 FastAPI

1. **安裝依賴**
   ```bash
   pip install fastapi uvicorn pydantic
   ```

2. **定義數據模型**
   ```python
   # 將 JavaScript 對象轉換為 Pydantic 模型
   from pydantic import BaseModel
   
   class User(BaseModel):
       name: str
       email: str
   ```

3. **轉換路由**
   ```python
   # Express: app.get('/users/:id', ...)
   # FastAPI: @app.get("/users/{id}")
   ```

4. **處理中間件**
   ```python
   # CORS, 認證等中間件有對應的 FastAPI 版本
   ```

5. **測試和部署**
   ```bash
   # 開發: uvicorn main:app --reload
   # 生產: gunicorn -w 4 -k uvicorn.workers.UvicornWorker
   ```

## 總結

兩個框架都是優秀的選擇，選擇取決於:

- **團隊技能**: JavaScript vs Python
- **項目需求**: 性能 vs 開發體驗
- **生態系統**: npm vs pip
- **類型安全**: 可選 vs 內建

**建議**: 
- 小型項目: 兩者都可
- 需要快速開發和文檔: **FastAPI**
- 需要 JavaScript 全棧: **Express**
- 需要機器學習整合: **FastAPI**
- 需要極致性能: **Express** (略優)

兩者都能構建出色的 API，選擇你和團隊最舒適的即可！
