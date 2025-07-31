from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import requests
import os
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS for production and development
CORS(app, origins=[
    "http://localhost:3000",  # Local development
    "https://*.vercel.app",   # All Vercel domains
    "https://concept-ai-pied.vercel.app",  # Your specific Vercel URL
    "https://concept-ai-*.vercel.app"  # Pattern matching
], supports_credentials=True)

# Add after CORS for debugging
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Use absolute path for database in production
import tempfile
if os.environ.get('RENDER'):
    # Use /tmp directory on Render (note: data won't persist between deployments)
    DATABASE_PATH = '/tmp/explanations.db'
else:
    # Use local directory for development
    DATABASE_PATH = 'explanations.db'

def init_db():
    """Initialize the SQLite database with error handling"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS explanations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                level TEXT NOT NULL,
                explanation TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(topic, level)
            )
        ''')
        
        conn.commit()
        conn.close()
        print(f"Database initialized successfully at {DATABASE_PATH}")
        return True
    except Exception as e:
        print(f"Database initialization failed: {e}")
        return False

def normalize_topic(topic):
    """
    Normalize topic for consistent caching and lookup
    This significantly improves cache hit rates by treating similar queries as identical
    """
    if not topic:
        return ""
    
    # Convert to lowercase
    normalized = topic.lower().strip()
    
    # Remove common punctuation
    import re
    normalized = re.sub(r'[^\w\s]', '', normalized)
    
    # Remove common prefixes that don't add semantic meaning
    prefixes_to_remove = [
        'explain', 'tell me', 'what is', 'what are', 'how does', 'how do',
        'describe', 'define', 'give me', 'show me', 'help me understand',
        'can you explain', 'please explain', 'i want to know', 'help with'
    ]
    
    for prefix in prefixes_to_remove:
        if normalized.startswith(prefix):
            normalized = normalized[len(prefix):].strip()
            break  # Only remove the first matching prefix
    
    # Remove extra whitespace and normalize multiple spaces to single space
    normalized = ' '.join(normalized.split())
    
    return normalized

def get_cached_explanation(topic, level):
    """Check if explanation exists in cache using normalized topic"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Normalize the topic for consistent lookup
        normalized_topic = normalize_topic(topic)
        
        cursor.execute(
            'SELECT explanation FROM explanations WHERE topic = ? AND level = ?',
            (normalized_topic, level.lower())
        )
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else None
    except Exception as e:
        print(f"Error retrieving from cache: {e}")
        return None

def save_explanation(topic, level, explanation):
    """Save explanation to cache using normalized topic"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Normalize the topic for consistent storage
        normalized_topic = normalize_topic(topic)
        
        cursor.execute(
            'INSERT OR REPLACE INTO explanations (topic, level, explanation) VALUES (?, ?, ?)',
            (normalized_topic, level.lower(), explanation)
        )
        conn.commit()
        print(f"Cached explanation for: {normalized_topic} ({level})")
    except Exception as e:
        print(f"Error saving to database: {e}")
    finally:
        try:
            conn.close()
        except:
            pass

def get_ai_explanation(topic, level):
    """Get explanation from OpenRouter DeepSeek API"""
    print(f"get_ai_explanation called with topic: {topic}, level: {level}")
    print(f"API Key present: {bool(OPENROUTER_API_KEY)}")
    
    if not OPENROUTER_API_KEY:
        print("OpenRouter API key not configured")
        return None, "OpenRouter API key not configured"
    
    # Create system prompt based on difficulty level with formatting instructions
    level_prompts = {
        "eli5": "Explain this concept as if I'm 5 years old. Use simple words, fun analogies, and make it engaging. Structure your response with clear headers using ### for main sections and #### for subsections. Use numbered lists (1. 2. 3.) for step-by-step explanations and bullet points (-) for key features. Make it fun and easy to understand!",
        "student": "Explain this concept at a high school or early college level. Use clear examples and avoid overly technical jargon. Structure your response with ### for main sections and #### for subsections. Use numbered lists for sequential information and bullet points for key concepts. Include practical examples and analogies.",
        "graduate": "Explain this concept at a graduate level. Include technical details, theoretical background, and academic context. Use ### for major sections, #### for subsections, and ##### for specific topics. Structure with numbered lists for processes and bullet points for key principles. Include relevant terminology and detailed explanations.",
        "advanced": "Explain this concept at an expert level. Include cutting-edge research, complex theories, and professional applications. Use clear section headers (### #### #####) and structure with numbered lists for methodologies and bullet points for key insights. Be comprehensive and technically precise."
    }
    
    system_prompt = level_prompts.get(level.lower(), level_prompts["student"])
    
    payload = {
        "model": "meta-llama/llama-3.2-3b-instruct:free",  # Free model for testing
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": f"Please explain: {topic}"
            }
        ],
        "max_tokens": 1000,  # Reduced for free tier
        "temperature": 0.7
    }
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        explanation = data['choices'][0]['message']['content']
        
        # Check if response was truncated
        finish_reason = data['choices'][0].get('finish_reason', '')
        if finish_reason == 'length':
            explanation += "\n\n*[Note: This explanation was truncated due to length limits. Try asking for a more specific aspect of this topic for a complete answer.]*"
        
        return explanation, None
        
    except requests.exceptions.RequestException as e:
        return None, f"API request failed: {str(e)}"
    except (KeyError, IndexError) as e:
        return None, f"Invalid API response format: {str(e)}"
    except Exception as e:
        return None, f"Unexpected error: {str(e)}"

@app.route('/explain', methods=['POST'])
def explain_concept():
    """Main endpoint to get concept explanations"""
    try:
        # Debug logging
        print(f"Received request to /explain")
        print(f"API Key configured: {bool(OPENROUTER_API_KEY)}")
        print(f"API Key length: {len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0}")
        
        data = request.get_json()
        print(f"Request data: {data}")
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        topic = data.get('topic', '').strip()
        level = data.get('level', '').strip()
        force_refresh = data.get('force_refresh', False)  # New parameter for regeneration
        
        print(f"Topic: {topic}, Level: {level}, Force refresh: {force_refresh}")
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        if not level:
            return jsonify({'error': 'Level is required'}), 400
        
        # Validate level
        valid_levels = ['eli5', 'student', 'graduate', 'advanced']
        if level.lower() not in valid_levels:
            return jsonify({'error': f'Invalid level. Must be one of: {", ".join(valid_levels)}'}), 400
        
        # Check cache first (skip if force_refresh is True)
        if not force_refresh:
            cached_explanation = get_cached_explanation(topic, level)
            if cached_explanation:
                print("Returning cached explanation")
                return jsonify({
                    'topic': topic,
                    'level': level,
                    'explanation': cached_explanation,
                    'cached': True,
                    'regenerated': False
                })
        
        # Get AI explanation
        print("Getting AI explanation...")
        explanation, error = get_ai_explanation(topic, level)
        
        if error:
            print(f"AI explanation error: {error}")
            return jsonify({'error': error}), 500
        
        # Save to cache (replace existing if force_refresh was used)
        save_explanation(topic, level, explanation)
        
        print("Returning fresh explanation")
        return jsonify({
            'topic': topic,
            'level': level,
            'explanation': explanation,
            'cached': False,
            'regenerated': force_refresh  # Indicate if this was a regeneration
        })
        
    except Exception as e:
        print(f"Exception in explain_concept: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/analytics', methods=['GET'])
def get_analytics():
    """Get comprehensive analytics data"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Total explanations count
    cursor.execute('SELECT COUNT(*) FROM explanations')
    total_explanations = cursor.fetchone()[0]
    
    # Most searched topics (top 10)
    cursor.execute('''
        SELECT topic, COUNT(*) as search_count
        FROM explanations 
        GROUP BY topic 
        ORDER BY search_count DESC 
        LIMIT 10
    ''')
    popular_topics = [{'topic': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    # Level distribution
    cursor.execute('''
        SELECT level, COUNT(*) as count
        FROM explanations 
        GROUP BY level 
        ORDER BY count DESC
    ''')
    level_distribution = [{'level': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    # Recent activity (last 7 days)
    cursor.execute('''
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM explanations 
        WHERE timestamp >= DATE('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
    ''')
    recent_activity = [{'date': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    # Cache statistics
    cache_hit_rate = 0  # We'll calculate this based on cached vs fresh requests
    
    conn.close()
    
    return jsonify({
        'total_explanations': total_explanations,
        'popular_topics': popular_topics,
        'level_distribution': level_distribution,
        'recent_activity': recent_activity,
        'cache_hit_rate': cache_hit_rate,
        'last_updated': datetime.now().isoformat()
    })

@app.route('/suggestions', methods=['GET'])
def get_suggestions():
    """Get search suggestions from cached topics"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Get distinct topics from cache, ordered by most recent
    cursor.execute('''
        SELECT DISTINCT topic, MAX(timestamp) as latest_timestamp
        FROM explanations 
        WHERE topic IS NOT NULL AND topic != ''
        GROUP BY topic
        ORDER BY latest_timestamp DESC 
        LIMIT 10
    ''')
    
    results = cursor.fetchall()
    conn.close()
    
    suggestions = [row[0] for row in results]
    
    return jsonify({
        'suggestions': suggestions,
        'count': len(suggestions)
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/test', methods=['GET', 'POST'])
def test_endpoint():
    """Simple test endpoint for debugging"""
    return jsonify({
        'message': 'Backend is working!',
        'method': request.method,
        'timestamp': datetime.now().isoformat(),
        'headers': dict(request.headers),
        'origin': request.headers.get('Origin', 'No origin header')
    })

@app.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM explanations')
    total_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT level, COUNT(*) FROM explanations GROUP BY level')
    level_counts = dict(cursor.fetchall())
    
    conn.close()
    
    return jsonify({
        'total_cached': total_count,
        'by_level': level_counts
    })

if __name__ == '__main__':
    # Initialize database with error handling
    db_initialized = init_db()
    if not db_initialized:
        print("Warning: Database initialization failed. App will run without database caching.")
    
    # Use PORT environment variable for Render deployment
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('ENVIRONMENT', 'development') == 'development'
    
    print(f"Starting server on port {port}")
    print(f"Database path: {DATABASE_PATH}")
    print(f"Debug mode: {debug_mode}")
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
