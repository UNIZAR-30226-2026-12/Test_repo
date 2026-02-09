@echo off
echo Installing Python dependencies...
pip install -r requirements.txt

echo Installing Node.js dependencies...
call npm install

echo Starting Backend...
start "Reversi Backend" cmd /k "python -m uvicorn backend:app --reload"

echo Starting Frontend...
start "Reversi Frontend" cmd /k "npm run dev"

echo Done! Servers should be running in new windows.
pause
