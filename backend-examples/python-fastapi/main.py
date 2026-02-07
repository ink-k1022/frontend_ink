"""
智能在地服務推薦系統 - FastAPI 後端
提供服務搜尋、評論管理、用戶偏好等 API 端點
"""
import math
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from models import (
    ServiceSearchRequest,
    ServiceSearchResponse,
    ReviewSubmitRequest,
    ReviewSubmitResponse,
    ReviewListResponse,
    UserPreferencesUpdateRequest,
    UserPreferencesResponse,
    HealthCheckResponse,
    ErrorResponse,
    ServiceProvider,
    Location,
    Review,
    UserPreferences
)

# ==================== 應用程序初始化 ====================

app = FastAPI(
    title="智能在地服務推薦系統 API",
    description="提供基於位置的服務推薦、評論管理和用戶偏好設定功能",
    version="1.0.0",
    docs_url="/api-docs",
    redoc_url="/redoc"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生產環境應限制為特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 模擬數據存儲 ====================

# 模擬服務提供者數據
MOCK_SERVICES = [
    {
        "id": "service_001",
        "name": "美味餐廳",
        "category": "餐廳",
        "location": {"latitude": 25.0330, "longitude": 121.5654},
        "address": "台北市大安區信義路四段1號",
        "rating": 4.5,
        "reviews_count": 128,
        "phone": "02-2345-6789",
        "opening_hours": "11:00-22:00",
        "description": "提供精緻的台灣料理"
    },
    {
        "id": "service_002",
        "name": "舒適咖啡廳",
        "category": "咖啡廳",
        "location": {"latitude": 25.0350, "longitude": 121.5670},
        "address": "台北市大安區敦化南路二段100號",
        "rating": 4.2,
        "reviews_count": 85,
        "phone": "02-2345-6790",
        "opening_hours": "08:00-20:00",
        "description": "安靜舒適的工作空間"
    },
    {
        "id": "service_003",
        "name": "專業健身中心",
        "category": "健身房",
        "location": {"latitude": 25.0400, "longitude": 121.5700},
        "address": "台北市大安區仁愛路四段50號",
        "rating": 4.8,
        "reviews_count": 256,
        "phone": "02-2345-6791",
        "opening_hours": "06:00-23:00",
        "description": "設備齊全的現代化健身房"
    }
]

# 模擬評論數據
MOCK_REVIEWS = [
    {
        "id": "review_001",
        "service_id": "service_001",
        "user_id": "user_123",
        "user_name": "張三",
        "rating": 5,
        "comment": "食物美味，服務態度很好！",
        "created_at": "2024-01-15T12:30:00Z"
    },
    {
        "id": "review_002",
        "service_id": "service_001",
        "user_id": "user_456",
        "user_name": "李四",
        "rating": 4,
        "comment": "環境不錯，價格合理。",
        "created_at": "2024-01-16T18:45:00Z"
    }
]

# 模擬用戶偏好數據
MOCK_USER_PREFERENCES = {}

# ==================== 輔助函數 ====================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    使用 Haversine 公式計算兩點之間的距離（公尺）
    """
    R = 6371000  # 地球半徑（公尺）
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2) ** 2)
    
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def filter_and_sort_services(
    category: str,
    latitude: float,
    longitude: float,
    radius: int,
    max_results: int
) -> list:
    """
    根據條件過濾和排序服務
    """
    results = []
    
    for service in MOCK_SERVICES:
        # 類別過濾
        if service["category"] != category:
            continue
        
        # 計算距離
        distance = calculate_distance(
            latitude,
            longitude,
            service["location"]["latitude"],
            service["location"]["longitude"]
        )
        
        # 半徑過濾
        if distance > radius:
            continue
        
        # 添加到結果
        service_copy = service.copy()
        service_copy["distance"] = round(distance, 2)
        results.append(service_copy)
    
    # 按距離排序
    results.sort(key=lambda x: x["distance"])
    
    # 限制結果數量
    return results[:max_results]


# ==================== API 端點 ====================

@app.get("/", response_model=HealthCheckResponse)
async def root():
    """根路徑 - 健康檢查"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """健康檢查端點"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }


@app.post("/api/services/search", response_model=ServiceSearchResponse)
async def search_services(request: ServiceSearchRequest):
    """
    搜尋附近的服務提供者
    
    根據類別、位置和半徑搜尋服務提供者
    """
    try:
        # 過濾和排序服務
        results = filter_and_sort_services(
            request.category,
            request.latitude,
            request.longitude,
            request.radius,
            request.max_results
        )
        
        return {
            "success": True,
            "data": results,
            "total_count": len(results),
            "search_params": {
                "category": request.category,
                "latitude": request.latitude,
                "longitude": request.longitude,
                "radius": request.radius,
                "max_results": request.max_results
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/services/{service_id}", response_model=ServiceProvider)
async def get_service_detail(service_id: str):
    """
    獲取服務提供者詳情
    
    根據服務ID獲取詳細信息
    """
    # 查找服務
    service = next((s for s in MOCK_SERVICES if s["id"] == service_id), None)
    
    if not service:
        raise HTTPException(status_code=404, detail="服務提供者不存在")
    
    # 添加距離（默認為0，因為沒有用戶位置）
    service_copy = service.copy()
    service_copy["distance"] = 0.0
    
    return service_copy


@app.post("/api/reviews", response_model=ReviewSubmitResponse)
async def submit_review(request: ReviewSubmitRequest):
    """
    提交服務評論
    
    用戶可以為服務提供者提交評分和評論
    """
    try:
        # 驗證服務是否存在
        service = next((s for s in MOCK_SERVICES if s["id"] == request.service_id), None)
        if not service:
            raise HTTPException(status_code=404, detail="服務提供者不存在")
        
        # 創建新評論
        new_review = {
            "id": f"review_{len(MOCK_REVIEWS) + 1:03d}",
            "service_id": request.service_id,
            "user_id": request.user_id,
            "user_name": f"用戶_{request.user_id[-3:]}",  # 模擬用戶名
            "rating": request.rating,
            "comment": request.comment,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        
        MOCK_REVIEWS.append(new_review)
        
        # 更新服務的評分和評論數
        service_reviews = [r for r in MOCK_REVIEWS if r["service_id"] == request.service_id]
        avg_rating = sum(r["rating"] for r in service_reviews) / len(service_reviews)
        service["rating"] = round(avg_rating, 1)
        service["reviews_count"] = len(service_reviews)
        
        return {
            "success": True,
            "message": "評論提交成功",
            "review": new_review
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reviews/{service_id}", response_model=ReviewListResponse)
async def get_reviews(
    service_id: str,
    limit: Optional[int] = Query(10, description="返回的評論數量", gt=0, le=100)
):
    """
    獲取服務的評論列表
    
    根據服務ID獲取相關評論
    """
    # 過濾評論
    service_reviews = [r for r in MOCK_REVIEWS if r["service_id"] == service_id]
    
    # 按時間排序（最新的在前）
    service_reviews.sort(key=lambda x: x["created_at"], reverse=True)
    
    # 限制數量
    limited_reviews = service_reviews[:limit]
    
    return {
        "success": True,
        "data": limited_reviews,
        "total_count": len(service_reviews)
    }


@app.get("/api/user-preferences/{user_id}", response_model=UserPreferencesResponse)
async def get_user_preferences(user_id: str):
    """
    獲取用戶偏好設定
    
    根據用戶ID獲取其偏好設定
    """
    if user_id not in MOCK_USER_PREFERENCES:
        raise HTTPException(status_code=404, detail="用戶偏好不存在")
    
    return {
        "success": True,
        "message": "獲取成功",
        "data": MOCK_USER_PREFERENCES[user_id]
    }


@app.put("/api/user-preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(request: UserPreferencesUpdateRequest):
    """
    更新用戶偏好設定
    
    用戶可以更新其偏好設定
    """
    try:
        user_prefs = {
            "user_id": request.user_id,
            "preferences": request.preferences,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        MOCK_USER_PREFERENCES[request.user_id] = user_prefs
        
        return {
            "success": True,
            "message": "偏好設定更新成功",
            "data": user_prefs
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories")
async def get_categories():
    """
    獲取所有可用的服務類別
    
    返回系統中所有的服務類別列表
    """
    categories = list(set(service["category"] for service in MOCK_SERVICES))
    return {
        "success": True,
        "data": categories,
        "total_count": len(categories)
    }


# ==================== 錯誤處理 ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP 異常處理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": "HTTPException",
            "message": exc.detail,
            "details": None
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """通用異常處理器"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "InternalServerError",
            "message": "服務器內部錯誤",
            "details": {"exception": str(exc)}
        }
    )


# ==================== 啟動服務器 ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3000,
        reload=True,
        log_level="info"
    )
