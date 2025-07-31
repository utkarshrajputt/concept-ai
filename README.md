# 🧠 Concept Simplifier

A web-based application that provides AI-powered explanations of technical concepts at different difficulty levels. Users can input any topic and receive tailored explanations ranging from ELI5 to advanced graduate-level content.

## 🚀 Features

- **Multiple Difficulty Levels**: Choose from ELI5, Student, Graduate, or Advanced explanations
- **AI-Powered**: Uses OpenRouter's DeepSeek-R1 API for high-quality explanations
- **Smart Caching**: SQLite database caches previous requests for faster responses
- **Modern UI**: Clean, responsive design built with React and TailwindCSS
- **Error Handling**: Comprehensive error handling and loading states
- **CORS Support**: Proper backend configuration for cross-origin requests

## 🛠️ Tech Stack

### Frontend
- **React** - Modern UI library
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icons

### Backend
- **Flask** - Python web framework
- **SQLite** - Lightweight database for caching
- **OpenRouter API** - AI explanation generation
- **Flask-CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
Concept/
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Tailwind styles
│   ├── index.html            # HTML template
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind configuration
│   └── postcss.config.js     # PostCSS configuration
├── backend/
│   ├── app.py                # Flask application
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- OpenRouter API key ([Get one here](https://openrouter.ai/))

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   - Copy `.env` file and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_actual_api_key_here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

5. **Run the Flask server**
   ```bash
   python app.py
   ```
   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### POST /explain
Get an explanation for a concept at a specific difficulty level.

**Request Body:**
```json
{
  "topic": "Quantum Computing",
  "level": "student"
}
```

**Response:**
```json
{
  "topic": "Quantum Computing",
  "level": "student",
  "explanation": "Quantum computing is a type of computing that...",
  "cached": false
}
```

**Valid Levels:**
- `eli5` - Explain like I'm 5 years old
- `student` - High school / Early college level
- `graduate` - Graduate level with technical details
- `advanced` - Expert level with cutting-edge research

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-16T10:30:00"
}
```

### GET /cache/stats
Get statistics about cached explanations.

**Response:**
```json
{
  "total_cached": 42,
  "by_level": {
    "student": 15,
    "eli5": 12,
    "graduate": 10,
    "advanced": 5
  }
}
```

## 🎨 Frontend Features

### User Interface Components
- **Topic Input**: Clean input field with validation
- **Difficulty Selection**: Visual radio buttons with descriptions
- **Loading States**: Animated spinner during API calls
- **Error Handling**: User-friendly error messages
- **Result Display**: Formatted explanation cards
- **Cache Indicators**: Shows when results are from cache

### Responsive Design
- Mobile-first approach
- Optimized for all screen sizes
- Modern gradient backgrounds
- Smooth transitions and animations

## 🔧 Configuration

### Vite Configuration (vite.config.js)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### Tailwind Configuration (tailwind.config.js)
Custom theme extensions for consistent styling across the application.

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set start command: `python app.py`
5. Add environment variables
6. Deploy

## 🧪 Development

### Running Tests
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
python -m pytest  # If tests are added
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend is production-ready as-is
```

## 🔐 Environment Variables

### Backend (.env)
```
OPENROUTER_API_KEY=your_openrouter_api_key
FLASK_ENV=development
FLASK_DEBUG=True
```

## 📝 Usage Examples

### Example API Call
```javascript
const response = await fetch('http://localhost:5000/explain', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topic: 'Machine Learning',
    level: 'graduate'
  })
});

const data = await response.json();
console.log(data.explanation);
```

### Example Topics
- Quantum Computing
- Machine Learning
- Blockchain Technology
- Neural Networks
- Cloud Computing
- Data Structures
- Algorithms
- Cryptography

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenRouter for providing access to DeepSeek-R1 API
- React and Vite teams for excellent development tools
- TailwindCSS for beautiful, utility-first styling
- Flask community for the robust web framework

---

**Happy Learning! 🎓**
