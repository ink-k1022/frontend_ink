# 智能在地服務推薦系統 - FastAPI 後端

這是使用 Python FastAPI 框架實現的後端 API 服務，提供基於位置的服務推薦、評論管理和用戶偏好設定功能。

## 功能特點

- ✅ RESTful API 設計
- ✅ 自動生成 API 文檔（Swagger UI & ReDoc）
- ✅ 完整的數據驗證（Pydantic）
- ✅ CORS 支持
- ✅ 類型提示和類型安全
- ✅ 異步處理支持
- ✅ 錯誤處理機制

## 技術棧

- **框架**: FastAPI 0.109.0
- **服務器**: Uvicorn
- **數據驗證**: Pydantic 2.5.3
- **Python 版本**: 3.8+

## 快速開始

### 1. 安裝依賴

```bash
# 創建虛擬環境（推薦）
python -m venv venv

# 激活虛擬環境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt
```

### 2. 啟動開發服務器

```bash
# 方法 1: 使用 Python 直接運行
python main.py

# 方法 2: 使用 uvicorn 命令
uvicorn main:app --reload --host 0.0.0.0 --port 3000

# 方法 3: 使用 uvicorn 命令（自定義設置）
uvicorn main:app --reload --port 8000 --log-level debug
```

服務器將在 `http://localhost:3000` 啟動

### 3. 訪問 API 文檔

FastAPI 自動生成交互式 API 文檔：

- **Swagger UI**: http://localhost:3000/api-docs
- **ReDoc**: http://localhost:3000/redoc

## API 端點

### 健康檢查

```http
GET /health
```

### 服務搜尋

```http
POST /api/services/search
Content-Type: application/json

{
  "category": "餐廳",
  "latitude": 25.0330,
  "longitude": 121.5654,
  "radius": 5000,
  "max_results": 10
}
```

### 獲取服務詳情

```http
GET /api/services/{service_id}
```

### 提交評論

```http
POST /api/reviews
Content-Type: application/json

{
  "service_id": "service_001",
  "user_id": "user_123",
  "rating": 5,
  "comment": "服務很好，非常滿意！"
}
```

### 獲取評論列表

```http
GET /api/reviews/{service_id}?limit=10
```

### 獲取用戶偏好

```http
GET /api/user-preferences/{user_id}
```

### 更新用戶偏好

```http
PUT /api/user-preferences
Content-Type: application/json

{
  "user_id": "user_123",
  "preferences": {
    "favorite_categories": ["餐廳", "咖啡廳"],
    "price_range": "medium",
    "preferred_radius": 3000
  }
}
```

### 獲取服務類別

```http
GET /api/categories
```

## 項目結構

```
python-fastapi/
├── main.py              # FastAPI 應用主程序
├── models.py            # Pydantic 數據模型
├── requirements.txt     # Python 依賴
└── README.md           # 本文檔
```

## 數據模型

### 請求模型

- `ServiceSearchRequest`: 服務搜尋請求
- `ReviewSubmitRequest`: 評論提交請求
- `UserPreferencesUpdateRequest`: 用戶偏好更新請求

### 響應模型

- `ServiceSearchResponse`: 服務搜尋響應
- `ServiceProvider`: 服務提供者信息
- `ReviewSubmitResponse`: 評論提交響應
- `ReviewListResponse`: 評論列表響應
- `UserPreferencesResponse`: 用戶偏好響應
- `HealthCheckResponse`: 健康檢查響應
- `ErrorResponse`: 錯誤響應

## 開發提示

### 熱重載

開發模式下使用 `--reload` 標誌，代碼修改後服務器會自動重啟：

```bash
uvicorn main:app --reload
```

### 環境變量

可以創建 `.env` 文件來配置環境變量：

```env
API_HOST=0.0.0.0
API_PORT=3000
DEBUG=True
```

### 測試

```bash
# 使用 pytest 運行測試
pytest

# 使用 httpx 測試 API
python -m pytest test_main.py -v
```

## 生產環境部署

### 使用 Gunicorn + Uvicorn Workers

```bash
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:3000
```

### 使用 Docker

創建 `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
```

構建和運行：

```bash
docker build -t local-service-api .
docker run -p 3000:3000 local-service-api
```

## 與前端整合

前端應用可以直接調用這些 API 端點。確保：

1. CORS 已正確配置（默認允許所有來源，生產環境需修改）
2. 前端 API 基礎 URL 設置為 `http://localhost:3000`
3. 所有請求使用正確的 Content-Type: `application/json`

## 性能優化

FastAPI 提供了出色的性能：

- 異步請求處理
- 自動數據驗證和序列化
- 高效的路由匹配
- 支持 HTTP/2

## 安全性考慮

生產環境部署時注意：

1. 限制 CORS 允許的來源
2. 添加身份驗證和授權（JWT、OAuth2）
3. 使用 HTTPS
4. 添加速率限制
5. 輸入驗證和消毒
6. 使用環境變量管理敏感配置

## 常見問題

### Q: 如何更改端口？

A: 修改 `main.py` 底部的 `uvicorn.run()` 調用中的 `port` 參數，或使用命令行：

```bash
uvicorn main:app --port 8000
```

### Q: 如何連接真實數據庫？

A: 添加數據庫依賴（如 SQLAlchemy、Motor for MongoDB）並創建數據庫模型和連接邏輯。

### Q: 如何添加認證？

A: FastAPI 提供了內建的 OAuth2 和 JWT 支持，參考官方文檔：
https://fastapi.tiangolo.com/tutorial/security/

## 參考資源

- [FastAPI 官方文檔](https://fastapi.tiangolo.com/)
- [Pydantic 文檔](https://docs.pydantic.dev/)
- [Uvicorn 文檔](https://www.uvicorn.org/)

## 授權

MIT License

## 作者

智能在地服務推薦系統開發團隊
