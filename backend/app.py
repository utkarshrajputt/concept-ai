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
CORS(app)  # Enable CORS for all routes

# Configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Google AI Studio Configuration
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

DATABASE_PATH = 'explanations.db'

# Debug: Check if API keys are loaded
print("=== API CONFIGURATION ===")
openrouter_status = 'Yes' if OPENROUTER_API_KEY else 'No'
google_status = 'Yes' if GOOGLE_API_KEY else 'No'

print(f"OPENROUTER_API_KEY loaded: {openrouter_status}")
if OPENROUTER_API_KEY:
    print(f"OpenRouter API Key starts with: {OPENROUTER_API_KEY[:10]}...")

print(f"GOOGLE_API_KEY loaded: {google_status}")
if GOOGLE_API_KEY:
    print(f"Google API Key starts with: {GOOGLE_API_KEY[:10]}...")

if not GOOGLE_API_KEY and not OPENROUTER_API_KEY:
    print("ERROR: No API keys found in environment variables")
    print("Available environment variables:")
    for key in os.environ.keys():
        if 'API' in key:
            print(f"  {key}: {'SET' if os.environ[key] else 'EMPTY'}")

# Determine which API to use
USE_GOOGLE_API = bool(GOOGLE_API_KEY)
print(f"Using API: {'Google AI Studio' if USE_GOOGLE_API else 'OpenRouter'}")
print("=" * 30)

@app.errorhandler(500)
def handle_500_error(e):
    """Handle 500 errors with detailed logging"""
    print(f"500 Error occurred: {str(e)}")
    import traceback
    print(f"Traceback: {traceback.format_exc()}")
    return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

def init_db():
    """Initialize the SQLite database"""
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
        print("Database initialized successfully")
        
        # Test the table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='explanations'")
        result = cursor.fetchone()
        if result:
            print("Explanations table confirmed to exist")
        else:
            print("ERROR: Explanations table was not created!")
            
    except Exception as e:
        print(f"Database initialization error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
    finally:
        conn.close()

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
        # Ensure database exists
        init_db()
        
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
        print(f"Cache retrieval error: {e}")
        return None

def save_explanation(topic, level, explanation):
    """Save explanation to cache using normalized topic"""
    try:
        # Ensure database exists
        init_db()
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Normalize the topic for consistent storage
        normalized_topic = normalize_topic(topic)
        
        cursor.execute(
            'INSERT OR REPLACE INTO explanations (topic, level, explanation) VALUES (?, ?, ?)',
            (normalized_topic, level.lower(), explanation)
        )
        conn.commit()
        print(f"Explanation saved for topic: {normalized_topic}, level: {level}")
        
    except Exception as e:
        print(f"Error saving to database: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
    finally:
        conn.close()

def get_ai_explanation(topic, level):
    """Get explanation from Google AI Studio or OpenRouter API"""
    
    if USE_GOOGLE_API and GOOGLE_API_KEY:
        return get_google_ai_explanation(topic, level)
    elif OPENROUTER_API_KEY:
        return get_openrouter_explanation(topic, level)
    else:
        return None, "No API key configured"

def get_google_ai_explanation(topic, level):
    """Get explanation from Google AI Studio Gemini API"""
    
    # Create system prompt based on difficulty level with formatting instructions
    level_prompts = {
        "eli5": "Explain this concept as if I'm 5 years old. Use simple words, fun analogies, and make it engaging. Structure your response with clear headers using ### for main sections and #### for subsections. Use numbered lists (1. 2. 3.) for step-by-step explanations and bullet points (-) for key features. Make it fun and easy to understand!",
        "student": "Explain this concept at a high school or early college level. Use clear examples and avoid overly technical jargon. Structure your response with ### for main sections and #### for subsections. Use numbered lists for sequential information and bullet points for key concepts. Include practical examples and analogies.",
        "graduate": "Explain this concept at a graduate level. Include technical details, theoretical background, and academic context. Use ### for major sections, #### for subsections, and ##### for specific topics. Structure with numbered lists for processes and bullet points for key principles. Include relevant terminology and detailed explanations.",
        "advanced": "Explain this concept at an expert level. Include cutting-edge research, complex theories, and professional applications. Use clear section headers (### #### #####) and structure with numbered lists for methodologies and bullet points for key insights. Be comprehensive and technically precise."
    }
    
    system_prompt = level_prompts.get(level.lower(), level_prompts["student"])
    
    # Adjust max_tokens based on level to balance detail vs speed
    max_tokens = 800 if level.lower() in ['graduate', 'advanced'] else 600
    
    payload = {
        "contents": [{
            "parts": [{
                "text": f"{system_prompt}\n\nPlease explain: {topic}"
            }]
        }],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.7,
            "topP": 0.8,
            "topK": 40
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        # Conservative timeout for Render's 30s worker limit
        timeout_duration = 12 if level.lower() in ['graduate', 'advanced'] else 10
        print(f"Google API: Level '{level}', timeout: {timeout_duration}s")
        
        url_with_key = f"{GOOGLE_URL}?key={GOOGLE_API_KEY}"
        response = requests.post(url_with_key, json=payload, headers=headers, timeout=timeout_duration)
        response.raise_for_status()
        
        data = response.json()
        
        if 'candidates' not in data or len(data['candidates']) == 0:
            return None, "Invalid response from Google AI service"
        
        if 'content' not in data['candidates'][0] or 'parts' not in data['candidates'][0]['content']:
            return None, "Invalid response format from Google AI service"
        
        explanation = data['candidates'][0]['content']['parts'][0]['text']
        
        # Check if response was truncated
        finish_reason = data['candidates'][0].get('finishReason', '')
        if finish_reason == 'MAX_TOKENS':
            explanation += "\n\n*[Note: This explanation was truncated due to length limits. Try asking for a more specific aspect of this topic for a complete answer.]*"
        
        return explanation, None
        
    except requests.exceptions.RequestException as e:
        return None, f"Google API request failed: {str(e)}"
    except (KeyError, IndexError) as e:
        return None, f"Invalid Google API response format: {str(e)}"
    except Exception as e:
        return None, f"Unexpected error: {str(e)}"

# BACKUP: OpenRouter implementation (commented out but kept for fallback)
def get_openrouter_explanation(topic, level):
    """Get explanation from OpenRouter API (BACKUP IMPLEMENTATION)"""
    if not OPENROUTER_API_KEY:
        return None, "OpenRouter API key not configured"
    
    # Create system prompt based on difficulty level with formatting instructions
    level_prompts = {
        "eli5": "Explain this concept as if I'm 5 years old. Use simple words, fun analogies, and make it engaging. Structure your response with clear headers using ### for main sections and #### for subsections. Use numbered lists (1. 2. 3.) for step-by-step explanations and bullet points (-) for key features. Make it fun and easy to understand!",
        "student": "Explain this concept at a high school or early college level. Use clear examples and avoid overly technical jargon. Structure your response with ### for main sections and #### for subsections. Use numbered lists for sequential information and bullet points for key concepts. Include practical examples and analogies.",
        "graduate": "Explain this concept at a graduate level. Include technical details, theoretical background, and academic context. Use ### for major sections, #### for subsections, and ##### for specific topics. Structure with numbered lists for processes and bullet points for key principles. Include relevant terminology and detailed explanations.",
        "advanced": "Explain this concept at an expert level. Include cutting-edge research, complex theories, and professional applications. Use clear section headers (### #### #####) and structure with numbered lists for methodologies and bullet points for key insights. Be comprehensive and technically precise."
    }
    
    system_prompt = level_prompts.get(level.lower(), level_prompts["student"])
    
    # Adjust max_tokens based on level to balance detail vs speed
    max_tokens = 800 if level.lower() in ['graduate', 'advanced'] else 600
    
    payload = {
        "model": "google/gemini-flash-1.5-8b",  # Free Gemini Flash model
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
        "max_tokens": max_tokens,  # Balanced for speed vs detail
        "temperature": 0.7
    }
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Ultra-conservative timeout for Render's 30s worker limit
        timeout_duration = 12 if level.lower() in ['graduate', 'advanced'] else 10
        print(f"OpenRouter API: Level '{level}', timeout: {timeout_duration}s")
        response = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=timeout_duration)
        response.raise_for_status()
        
        data = response.json()
        
        if 'choices' not in data or len(data['choices']) == 0:
            return None, "Invalid response from AI service"
        
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
        # Check if at least one API key is available
        if not GOOGLE_API_KEY and not OPENROUTER_API_KEY:
            print("ERROR: No API keys are configured")
            return jsonify({'error': 'No API keys configured on server'}), 500
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        topic = data.get('topic', '').strip()
        level = data.get('level', '').strip()
        force_refresh = data.get('force_refresh', False)  # New parameter for regeneration
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        if not level:
            return jsonify({'error': 'Level is required'}), 400
        
        # Validate level
        valid_levels = ['eli5', 'student', 'graduate', 'advanced']
        if level.lower() not in valid_levels:
            return jsonify({'error': f'Invalid level. Must be one of: {", ".join(valid_levels)}'}), 400
        
        print(f"Request: topic='{topic}', level='{level}', API={'Google' if USE_GOOGLE_API else 'OpenRouter'}")
        
        # Check cache first (skip if force_refresh is True)
        if not force_refresh:
            try:
                cached_explanation = get_cached_explanation(topic, level)
                if cached_explanation:
                    return jsonify({
                        'topic': topic,
                        'level': level,
                        'explanation': cached_explanation,
                        'cached': True,
                        'regenerated': False,
                        'api_used': 'Cached'
                    })
            except Exception as cache_error:
                print(f"Cache error (non-fatal): {cache_error}")
                # Continue to AI explanation if cache fails
        
        # Get AI explanation
        explanation, error = get_ai_explanation(topic, level)
        
        if error:
            print(f"AI explanation error: {error}")
            return jsonify({'error': error}), 500
        
        # Save to cache (replace existing if force_refresh was used)
        try:
            save_explanation(topic, level, explanation)
        except Exception as cache_error:
            print(f"Cache save error (non-fatal): {cache_error}")
            # Continue even if caching fails
        
        return jsonify({
            'topic': topic,
            'level': level,
            'explanation': explanation,
            'cached': False,
            'regenerated': force_refresh,
            'api_used': 'Google AI Studio' if USE_GOOGLE_API else 'OpenRouter'
        })
        
    except Exception as e:
        print(f"Unexpected error in explain_concept: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
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

@app.route('/debug/env', methods=['GET'])
def debug_env():
    """Debug endpoint to check environment variables (for troubleshooting)"""
    return jsonify({
        'api_key_set': bool(OPENROUTER_API_KEY),
        'api_key_length': len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0,
        'flask_env': os.getenv('FLASK_ENV', 'not_set'),
        'port': os.environ.get('PORT', 'not_set'),
        'available_env_vars': [key for key in os.environ.keys() if 'OPENROUTER' in key or 'API' in key or 'FLASK' in key]
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
    init_db()
    # Use PORT from environment for deployment, fallback to 5000 for local
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
