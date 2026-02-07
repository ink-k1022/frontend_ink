#!/bin/bash

# 智能在地服務推薦系統 - FastAPI 後端啟動腳本

echo "========================================"
echo "  智能在地服務推薦系統 - FastAPI 後端"
echo "========================================"
echo ""

# 檢查 Python 是否安裝
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤: 未找到 Python 3"
    echo "請先安裝 Python 3.8 或更高版本"
    exit 1
fi

echo "✓ Python 版本: $(python3 --version)"
echo ""

# 檢查虛擬環境
if [ ! -d "venv" ]; then
    echo "📦 創建虛擬環境..."
    python3 -m venv venv
    echo "✓ 虛擬環境創建完成"
    echo ""
fi

# 激活虛擬環境
echo "🔄 激活虛擬環境..."
source venv/bin/activate

# 安裝依賴
echo "📥 安裝依賴套件..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✓ 依賴安裝完成"
echo ""

# 啟動服務器
echo "🚀 啟動 FastAPI 服務器..."
echo "   訪問地址: http://localhost:3000"
echo "   API 文檔: http://localhost:3000/api-docs"
echo "   ReDoc: http://localhost:3000/redoc"
echo ""
echo "按 Ctrl+C 停止服務器"
echo "========================================"
echo ""

# 使用 uvicorn 啟動
python3 main.py
