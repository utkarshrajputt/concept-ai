@echo off
echo 🚀 Starting Concept Simplifier Development Servers...

:: Check if we're in the right directory
if not exist "backend\app.py" (
    echo ❌ Please run this script from the root Concept directory
    pause
    exit /b 1
)

:: Start backend in a new window
echo 🔧 Starting Flask backend...
start "Flask Backend" cmd /k "cd backend && venv\Scripts\activate && python app.py"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend in a new window
echo 🎨 Starting React frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo ✅ Development servers started!
echo 📝 Backend: http://localhost:5000
echo 📝 Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
