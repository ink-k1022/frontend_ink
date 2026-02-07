@echo off
REM 智能在地服務推薦系統 - FastAPI 後端啟動腳本 (Windows)

echo ========================================
echo   智能在地服務推薦系統 - FastAPI 後端
echo ========================================
echo.

REM 檢查 Python 是否安裝
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 錯誤: 未找到 Python
    echo 請先安裝 Python 3.8 或更高版本
    pause
    exit /b 1
)

python --version
echo.

REM 檢查虛擬環境
if not exist "venv" (
    echo 📦 創建虛擬環境...
    python -m venv venv
    echo ✓ 虛擬環境創建完成
    echo.
)

REM 激活虛擬環境
echo 🔄 激活虛擬環境...
call venv\Scripts\activate.bat

REM 安裝依賴
echo 📥 安裝依賴套件...
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q
echo ✓ 依賴安裝完成
echo.

REM 啟動服務器
echo 🚀 啟動 FastAPI 服務器...
echo    訪問地址: http://localhost:3000
echo    API 文檔: http://localhost:3000/api-docs
echo    ReDoc: http://localhost:3000/redoc
echo.
echo 按 Ctrl+C 停止服務器
echo ========================================
echo.

REM 使用 Python 啟動
python main.py

pause
