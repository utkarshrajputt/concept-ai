# 🧠 ConceptAI - Intelligent Concept Explanation Platform

A sophisticated web application that delivers AI-powered explanations of any concept at multiple difficulty levels. ConceptAI provides tailored explanations ranging from simple ELI5 to advanced graduate-level content, making complex topics accessible to learners at every level.

## ✨ Features

### 🎯 Core Functionality

- **Multi-Level Explanations**: Four difficulty levels (ELI5, Student, Graduate, Advanced)
- **AI-Powered Insights**: Utilizes DeepSeek R1 Free model via OpenRouter API
- **Smart Caching System**: SQLite database for instant retrieval of previous explanations
- **Random Topic Generator**: Discover new concepts with randomized suggestions
- **History Tracking**: Keep track of your learning journey

### 🎨 User Experience

- **Modern Interface**: Clean, intuitive design with dark/light theme support
- **Mobile-Optimized**: Responsive layout for seamless mobile experience
- **Real-time Feedback**: Loading states, error handling, and status indicators
- **Progress Analytics**: Visual progress tracking and statistics
- **Code Block Styling**: Beautiful syntax highlighting for technical explanations

### 🔧 Technical Excellence

- **Performance Optimized**: Fast loading with intelligent caching
- **Error Resilience**: Comprehensive error handling and retry mechanisms
- **Cross-Platform**: Works across all modern browsers and devices
- **Accessibility**: WCAG compliant design for inclusive learning

## 🛠️ Technology Stack

### Frontend

- **React 18** - Modern UI library with hooks
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool and dev server
- **Lucide React** - Beautiful, consistent icons
- **Modern CSS** - CSS Grid, Flexbox, and custom properties

### Backend

- **Flask** - Lightweight Python web framework
- **SQLite** - Embedded database for caching
- **OpenRouter API** - AI model access (DeepSeek R1 Free)
- **Flask-CORS** - Cross-origin resource sharing
- **Python-dotenv** - Environment variable management

## 📁 Project Architecture

```
ConceptAI/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.jsx          # Main React component (6000+ lines)
│   │   ├── main.jsx         # Application entry point
│   │   └── index.css        # Custom styles and animations
│   ├── public/              # Static assets
│   │   ├── favicon.svg      # Application icon
│   │   └── favicon-16x16.svg
│   ├── index.html           # HTML template with PWA support
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.js       # Vite build configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── postcss.config.js    # PostCSS processing
├── backend/                 # Flask backend API
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables (API keys)
│   ├── explanations.db    # SQLite database
│   └── test_api.py        # API testing utilities
├── PROJECT_OVERVIEW.md    # Detailed project documentation
├── PROJECT_PHASES.md      # Development phases
├── setup.bat             # Windows setup script
├── setup.sh              # Unix setup script
├── dev.bat               # Development server launcher
└── README.md             # This documentation
```

## 🚀 Quick Start Guide

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
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
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
const response = await fetch("http://localhost:5000/explain", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    topic: "Machine Learning",
    level: "graduate",
  }),
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

## � Project Structure

```
Concept/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   ├── main.jsx         # Application entry point
│   │   └── index.css        # Global styles and animations
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
├── backend/                 # Flask backend API
│   ├── app.py              # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   ├── explanations.db     # SQLite database (auto-generated)
│   └── test_api.py         # API testing script
├── README.md               # Project documentation
├── setup.bat              # Windows setup script
├── setup.sh               # Unix/Linux setup script
└── dev.bat                # Development start script
```

## 🐛 Troubleshooting

### Common Issues

**1. API Key Issues**

- Ensure your OpenRouter API key is correctly set in the `.env` file
- Verify the key has sufficient credits and permissions

**2. CORS Issues**

- Make sure Flask-CORS is installed: `pip install flask-cors`
- Backend should be running on port 5000

**3. Database Issues**

- Delete `explanations.db` file to reset the cache
- Ensure SQLite3 is available on your system

**4. Frontend Build Issues**

- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (requires Node 16+)

**5. Port Conflicts**

- Frontend default: http://localhost:3000
- Backend default: http://localhost:5000
- Change ports in `vite.config.js` if needed

### Performance Tips

- Explanations are cached automatically for faster responses
- Clear cache via the "Clear All History" button if needed
- Use appropriate difficulty levels for better AI responses

## 🔄 Version History

- **v1.0.0** - Initial release with basic explanation functionality
- **v1.1.0** - Added caching system and improved UI
- **v1.2.0** - Enhanced mobile responsiveness and modern sidebar design
- **v1.3.0** - Implemented notification system and random topic feature
- **v1.4.0** - Code block styling improvements and DeepSeek integration

## �🙏 Acknowledgments

- OpenRouter for providing access to DeepSeek-R1 API
- React and Vite teams for excellent development tools
- TailwindCSS for beautiful, utility-first styling
- Flask community for the robust web framework
- Lucide React for beautiful icons

---

## 👨‍💻 Developer

**Created and developed by:** [Utkarsh Rajput](https://github.com/utkarshrajputt)

---

**Happy Learning! 🎓**
