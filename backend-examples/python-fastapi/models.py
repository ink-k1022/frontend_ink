"""
數據模型定義
定義所有 API 請求和響應的數據模型
"""
from typing import List, Optional
from pydantic import BaseModel, Field


# ==================== 請求模型 ====================

class ServiceSearchRequest(BaseModel):
    """服務搜尋請求模型"""
    category: str = Field(..., description="服務類別")
    latitude: float = Field(..., description="緯度", ge=-90, le=90)
    longitude: float = Field(..., description="經度", ge=-180, le=180)
    radius: Optional[int] = Field(5000, description="搜尋半徑（公尺）", gt=0)
    max_results: Optional[int] = Field(10, description="最大結果數", gt=0, le=50)

    class Config:
        json_schema_extra = {
            "example": {
                "category": "餐廳",
                "latitude": 25.0330,
                "longitude": 121.5654,
                "radius": 5000,
                "max_results": 10
            }
        }


class ReviewSubmitRequest(BaseModel):
    """評論提交請求模型"""
    service_id: str = Field(..., description="服務提供者ID")
    user_id: str = Field(..., description="用戶ID")
    rating: int = Field(..., description="評分（1-5）", ge=1, le=5)
    comment: str = Field(..., description="評論內容", min_length=1, max_length=1000)

    class Config:
        json_schema_extra = {
            "example": {
                "service_id": "service_001",
                "user_id": "user_123",
                "rating": 5,
                "comment": "服務很好，非常滿意！"
            }
        }


class UserPreferencesUpdateRequest(BaseModel):
    """用戶偏好更新請求模型"""
    user_id: str = Field(..., description="用戶ID")
    preferences: dict = Field(..., description="用戶偏好設定")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "preferences": {
                    "favorite_categories": ["餐廳", "咖啡廳"],
                    "price_range": "medium",
                    "preferred_radius": 3000
                }
            }
        }


# ==================== 響應模型 ====================

class Location(BaseModel):
    """位置信息模型"""
    latitude: float = Field(..., description="緯度")
    longitude: float = Field(..., description="經度")


class ServiceProvider(BaseModel):
    """服務提供者模型"""
    id: str = Field(..., description="服務提供者ID")
    name: str = Field(..., description="名稱")
    category: str = Field(..., description="服務類別")
    location: Location = Field(..., description="位置信息")
    address: str = Field(..., description="地址")
    rating: float = Field(..., description="評分", ge=0, le=5)
    reviews_count: int = Field(..., description="評論數量", ge=0)
    distance: float = Field(..., description="距離（公尺）", ge=0)
    phone: Optional[str] = Field(None, description="電話號碼")
    opening_hours: Optional[str] = Field(None, description="營業時間")
    description: Optional[str] = Field(None, description="描述")


class ServiceSearchResponse(BaseModel):
    """服務搜尋響應模型"""
    success: bool = Field(..., description="請求是否成功")
    data: List[ServiceProvider] = Field(..., description="服務提供者列表")
    total_count: int = Field(..., description="總結果數")
    search_params: dict = Field(..., description="搜尋參數")


class Review(BaseModel):
    """評論模型"""
    id: str = Field(..., description="評論ID")
    service_id: str = Field(..., description="服務提供者ID")
    user_id: str = Field(..., description="用戶ID")
    user_name: str = Field(..., description="用戶名稱")
    rating: int = Field(..., description="評分", ge=1, le=5)
    comment: str = Field(..., description="評論內容")
    created_at: str = Field(..., description="創建時間")


class ReviewSubmitResponse(BaseModel):
    """評論提交響應模型"""
    success: bool = Field(..., description="提交是否成功")
    message: str = Field(..., description="響應消息")
    review: Optional[Review] = Field(None, description="創建的評論")


class ReviewListResponse(BaseModel):
    """評論列表響應模型"""
    success: bool = Field(..., description="請求是否成功")
    data: List[Review] = Field(..., description="評論列表")
    total_count: int = Field(..., description="總評論數")


class UserPreferences(BaseModel):
    """用戶偏好模型"""
    user_id: str = Field(..., description="用戶ID")
    preferences: dict = Field(..., description="用戶偏好設定")
    updated_at: str = Field(..., description="更新時間")


class UserPreferencesResponse(BaseModel):
    """用戶偏好響應模型"""
    success: bool = Field(..., description="請求是否成功")
    message: str = Field(..., description="響應消息")
    data: Optional[UserPreferences] = Field(None, description="用戶偏好數據")


class HealthCheckResponse(BaseModel):
    """健康檢查響應模型"""
    status: str = Field(..., description="服務狀態")
    timestamp: str = Field(..., description="時間戳")
    version: str = Field(..., description="API版本")


class ErrorResponse(BaseModel):
    """錯誤響應模型"""
    success: bool = Field(False, description="請求是否成功")
    error: str = Field(..., description="錯誤類型")
    message: str = Field(..., description="錯誤消息")
    details: Optional[dict] = Field(None, description="錯誤詳情")
