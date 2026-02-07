"""
API 端點測試
使用 pytest 和 httpx 測試 FastAPI 應用
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    """測試根路徑"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data
    assert data["version"] == "1.0.0"


def test_health_check():
    """測試健康檢查端點"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_search_services():
    """測試服務搜尋"""
    payload = {
        "category": "餐廳",
        "latitude": 25.0330,
        "longitude": 121.5654,
        "radius": 5000,
        "max_results": 10
    }
    response = client.post("/api/services/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "total_count" in data
    assert isinstance(data["data"], list)


def test_search_services_invalid_data():
    """測試無效的搜尋請求"""
    payload = {
        "category": "餐廳",
        "latitude": 200,  # 無效的緯度
        "longitude": 121.5654
    }
    response = client.post("/api/services/search", json=payload)
    assert response.status_code == 422  # Validation Error


def test_get_service_detail():
    """測試獲取服務詳情"""
    response = client.get("/api/services/service_001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "service_001"
    assert "name" in data
    assert "category" in data


def test_get_service_detail_not_found():
    """測試獲取不存在的服務"""
    response = client.get("/api/services/nonexistent")
    assert response.status_code == 404


def test_submit_review():
    """測試提交評論"""
    payload = {
        "service_id": "service_001",
        "user_id": "test_user",
        "rating": 5,
        "comment": "很棒的服務！"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "評論提交成功"
    assert data["review"] is not None


def test_submit_review_invalid_rating():
    """測試提交無效評分"""
    payload = {
        "service_id": "service_001",
        "user_id": "test_user",
        "rating": 6,  # 無效的評分
        "comment": "測試"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 422


def test_get_reviews():
    """測試獲取評論列表"""
    response = client.get("/api/reviews/service_001")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)


def test_update_user_preferences():
    """測試更新用戶偏好"""
    payload = {
        "user_id": "test_user",
        "preferences": {
            "favorite_categories": ["餐廳", "咖啡廳"],
            "price_range": "medium"
        }
    }
    response = client.put("/api/user-preferences", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "偏好設定更新成功"


def test_get_user_preferences():
    """測試獲取用戶偏好"""
    # 先創建偏好
    payload = {
        "user_id": "test_user_2",
        "preferences": {"test": "data"}
    }
    client.put("/api/user-preferences", json=payload)
    
    # 然後獲取
    response = client.get("/api/user-preferences/test_user_2")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user_id"] == "test_user_2"


def test_get_categories():
    """測試獲取服務類別"""
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
