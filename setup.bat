@echo off
echo 🧠 Setting up Concept Simplifier...

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Python and Node.js are installed

:: Setup Backend
echo 🔧 Setting up backend...
cd backend

:: Create virtual environment
echo Creating Python virtual environment...
python -m venv venv

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

cd ..

:: Setup Frontend
echo 🎨 Setting up frontend...
cd frontend

:: Install Node.js dependencies
echo Installing Node.js dependencies...
npm install

cd ..

echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Add your OpenRouter API key to backend\.env
echo 2. Start the backend: cd backend ^&^& python app.py
echo 3. Start the frontend: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:3000 in your browser
echo.
echo 🎉 Happy coding!
pause
