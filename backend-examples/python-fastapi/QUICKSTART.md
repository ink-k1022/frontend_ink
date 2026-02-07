# FastAPI 後端快速啟動指南

## 🚀 5 分鐘快速開始

### 方法 1: 使用啟動腳本（推薦）

**Linux/macOS:**
```bash
cd backend-examples/python-fastapi
./start.sh
```

**Windows:**
```cmd
cd backend-examples\python-fastapi
start.bat
```

### 方法 2: 手動安裝

```bash
# 1. 進入目錄
cd backend-examples/python-fastapi

# 2. 創建虛擬環境（推薦）
python3 -m venv venv

# 3. 激活虛擬環境
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 4. 安裝依賴
pip install -r requirements.txt

# 5. 啟動服務器
python main.py
```

## 📡 訪問 API

服務器啟動後，訪問：

- **API 基礎地址**: http://localhost:3000
- **交互式文檔 (Swagger)**: http://localhost:3000/api-docs
- **API 文檔 (ReDoc)**: http://localhost:3000/redoc
- **健康檢查**: http://localhost:3000/health

## 🧪 測試 API

### 使用 Swagger UI（推薦）

1. 訪問 http://localhost:3000/api-docs
2. 點擊任意端點
3. 點擊 "Try it out"
4. 填入參數
5. 點擊 "Execute"

### 使用 curl

```bash
# 健康檢查
curl http://localhost:3000/health

# 搜尋服務
curl -X POST http://localhost:3000/api/services/search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "餐廳",
    "latitude": 25.0330,
    "longitude": 121.5654,
    "radius": 5000,
    "max_results": 10
  }'

# 獲取服務詳情
curl http://localhost:3000/api/services/service_001

# 提交評論
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "service_001",
    "user_id": "user_123",
    "rating": 5,
    "comment": "很棒的服務！"
  }'

# 獲取評論
curl http://localhost:3000/api/reviews/service_001?limit=10

# 獲取服務類別
curl http://localhost:3000/api/categories
```

### 使用 Python requests

```python
import requests

# 搜尋服務
response = requests.post('http://localhost:3000/api/services/search', json={
    "category": "餐廳",
    "latitude": 25.0330,
    "longitude": 121.5654,
    "radius": 5000,
    "max_results": 10
})

print(response.json())
```

### 使用 JavaScript fetch

```javascript
// 搜尋服務
fetch('http://localhost:3000/api/services/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    category: '餐廳',
    latitude: 25.0330,
    longitude: 121.5654,
    radius: 5000,
    max_results: 10
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔧 常見問題

### 問題：端口已被占用

```bash
# 更改端口 - 編輯 main.py 最後一行
uvicorn.run("main:app", host="0.0.0.0", port=8000)  # 改為 8000
```

### 問題：找不到模組

```bash
# 確保在虛擬環境中
pip install -r requirements.txt
```

### 問題：CORS 錯誤

默認配置允許所有來源。如需限制，修改 `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # 只允許特定來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📚 下一步

- 閱讀 [README.md](README.md) 了解完整文檔
- 查看 [COMPARISON.md](../COMPARISON.md) 了解 FastAPI vs Express
- 探索 [models.py](models.py) 了解數據模型
- 運行測試: `pytest test_main.py -v`
- 整合到前端應用

## 🎯 關鍵特性

- ✅ **自動驗證**: 所有輸入自動驗證
- ✅ **類型安全**: 完整的類型提示
- ✅ **自動文檔**: OpenAPI/Swagger 自動生成
- ✅ **異步支持**: 高性能異步處理
- ✅ **易於測試**: 內建測試支持

享受使用 FastAPI！🎉
