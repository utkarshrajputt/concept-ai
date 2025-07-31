#!/bin/bash

# Concept Simplifier Setup Script
echo "🧠 Setting up Concept Simplifier..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Python and Node.js are installed"

# Setup Backend
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python -m venv venv

# Activate virtual environment (Linux/Mac)
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    source venv/bin/activate
else
    # Windows
    venv\Scripts\activate
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

cd ..

# Setup Frontend
echo "🎨 Setting up frontend..."
cd frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add your OpenRouter API key to backend/.env"
echo "2. Start the backend: cd backend && python app.py"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🎉 Happy coding!"
