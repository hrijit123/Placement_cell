@echo off
color 0A
echo =========================================================
echo       Starting Deaf Empowerment ISL Portal
echo =========================================================
echo.

:: Get the directory where the batch file is located
cd /d "%~dp0"

echo [1/2] Initializing Machine Learning Backend...
cd ml-service

:: Check if virtual environment exists, if not, create it
if not exist "venv\" (
    echo    - Creating Python Virtual Environment...
    py -m venv venv
)

:: Activate venv and install requirements quietly
call venv\Scripts\activate.bat
echo    - Verifying ML Dependencies...
pip install -r requirements.txt -q

:: Start the ML service in a new window so it doesn't block. Use /k so it stays open if it crashes.
echo    - Launching ML Server on port 8000 (Local Network Accessible)...
start "ISL ML Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0"

cd ..

echo.
echo [2/2] Initializing Next.js Web Portal...
cd web-portal

:: Verify node modules exist
if not exist "node_modules\" (
    echo    - Installing Node Modules...
    call npm install
)

:: Start the Next.js frontend in a new window
echo    - Launching Web Portal on port 3000 (Local Network Accessible)...
start "ISL Web Frontend" cmd /k "npm run dev -- -H 0.0.0.0"

cd ..

echo.
echo =========================================================
echo       All Services Successfully Launched!
echo =========================================================
echo.
echo You can now access your platform from any device on your Wi-Fi:
echo - Frontend: http://localhost:3000  (or your Network IP)
echo - Backend:  http://localhost:8000  (Hidden ML processing)
echo.
echo Note: Keep the two new terminal windows open while you work.
echo You can close this specific window.
echo.
echo Opening browser...
start http://localhost:3000
pause
