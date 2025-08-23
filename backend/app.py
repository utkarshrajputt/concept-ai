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

def validate_educational_concept(topic):
    """
    Comprehensive server-side validation for educational concepts
    Provides robust security layer matching frontend validation
    """
    if not topic or not isinstance(topic, str):
        return {'is_valid': False, 'error': 'Please enter a topic to explain'}
    
    topic_lower = topic.lower().strip()
    
    # Basic length checks
    if len(topic_lower) < 2:
        return {'is_valid': False, 'error': 'Topic must be at least 2 characters long'}
    
    if len(topic_lower) > 200:
        return {'is_valid': False, 'error': 'Topic must be less than 200 characters'}
    
    # Comprehensive list of legitimate educational topics to always allow
    educational_concepts = [
        # Technology & Computer Science
        'machine learning', 'artificial intelligence', 'deep learning', 'neural networks', 'computer vision',
        'natural language processing', 'data science', 'big data', 'cloud computing', 'blockchain',
        'virtual reality', 'augmented reality', 'internet of things', 'quantum computing', 'cyber security',
        'software engineering', 'web development', 'mobile development', 'database management',
        'user experience', 'user interface', 'information security', 'network security',
        
        # Sciences
        'quantum physics', 'organic chemistry', 'molecular biology', 'cell biology', 'genetic engineering',
        'climate change', 'renewable energy', 'nuclear physics', 'astrophysics', 'marine biology',
        'environmental science', 'forensic science', 'materials science', 'biomedical engineering',
        'chemical engineering', 'electrical engineering', 'mechanical engineering', 'civil engineering',
        
        # Mathematics
        'linear algebra', 'differential equations', 'complex analysis', 'number theory', 'graph theory',
        'game theory', 'probability theory', 'statistical analysis', 'mathematical modeling',
        
        # Business & Economics
        'supply chain', 'project management', 'financial markets', 'behavioral economics',
        'digital marketing', 'business strategy', 'risk management', 'quality assurance',
        
        # Medical & Health
        'human anatomy', 'medical ethics', 'public health', 'mental health', 'physical therapy',
        'pharmaceutical science', 'medical imaging', 'surgical procedures', 'preventive medicine',
        
        # Other Academic Fields
        'art history', 'world history', 'political science', 'social psychology', 'cognitive psychology',
        'international relations', 'environmental law', 'constitutional law', 'educational psychology'
    ]
    
    # Check if it's a known educational concept
    if topic_lower in educational_concepts:
        return {'is_valid': True}
    
    # Comprehensive list of common first names to block
    common_first_names = [
        'john', 'jane', 'michael', 'sarah', 'david', 'mary', 'robert', 'jennifer', 'william', 'elizabeth', 
        'james', 'maria', 'christopher', 'susan', 'daniel', 'jessica', 'matthew', 'karen', 'anthony', 'nancy', 
        'mark', 'lisa', 'donald', 'betty', 'steven', 'helen', 'andrew', 'sandra', 'joshua', 'donna',
        'utkarsh', 'raj', 'priya', 'amit', 'ravi', 'neha', 'rahul', 'pooja', 'vikram', 'anita',
        'alex', 'chris', 'sam', 'pat', 'jordan', 'taylor', 'morgan', 'casey', 'riley', 'avery'
    ]
    
    # Check if input is just a common first name
    if topic_lower in common_first_names:
        return {
            'is_valid': False,
            'error': f'"{topic}" appears to be a person\'s name. Please ask about educational topics like "photosynthesis", "machine learning", or "quantum physics".'
        }
    
    # Check for personal name patterns (more specific than frontend)
    words = topic_lower.split()
    if len(words) == 2:
        first_word, second_word = words
        # Only flag as personal name if first word is a common first name AND second word could be a surname
        if (first_word in common_first_names and 
            second_word not in ['learning', 'reality', 'physics', 'science', 'theory', 'analysis', 'study', 'research', 
                               'engineering', 'computing', 'intelligence', 'processing', 'management', 'development', 
                               'programming', 'biology', 'chemistry', 'mathematics', 'psychology', 'history', 'literature'] and
            len(second_word) > 2):
            return {
                'is_valid': False,
                'error': 'This looks like a person\'s name. Try asking about educational concepts, scientific topics, or academic subjects instead.'
            }
    
    # Check for vague/generic questions that aren't educational concepts
    vague_questions = [
        'what', 'why', 'how', 'when', 'where', 'who', 'which', 'tell me', 'explain', 'help',
        'anything', 'something', 'nothing', 'everything', 'whatever', 'stuff', 'things'
    ]
    
    if topic_lower in vague_questions:
        return {
            'is_valid': False,
            'error': f'Please be more specific. Instead of "{topic}", try asking about a particular concept like "photosynthesis", "calculus", or "machine learning".'
        }
    
    # Check for non-educational content patterns
    import re
    non_educational_patterns = [
        r'^(hey|hi|hello|what\'s up|how are you|good morning|good evening)',  # Greetings
        r'^(tell me about yourself|who are you|what can you do|what is this)',  # Personal questions
        r'(gossip|celebrity|entertainment|movie star|pop star|influencer)',  # Entertainment
        r'(dating|relationship|romance|love|crush|boyfriend|girlfriend)',  # Personal relationships
        r'(restaurant|food recipe|cooking|menu|pizza|burger)',  # Food (unless educational)
        r'(shopping|buying|purchase|sale|discount|price)',  # Commerce
        r'(weather|forecast|temperature today|rain|sunny)',  # Weather
        r'(sports score|game result|match result|football|basketball)',  # Sports scores
        r'(news|current events|politics today|election|vote)',  # Current events
        r'(test|testing|check|random|trial)',  # Test inputs
    ]
    
    for pattern in non_educational_patterns:
        if re.search(pattern, topic_lower, re.IGNORECASE):
            return {
                'is_valid': False,
                'error': 'I focus on educational and technical concepts. Try asking about science, technology, mathematics, history, or academic subjects.'
            }
    
    # Check for educational indicators (allow these through)
    educational_keywords = [
        'theory', 'principle', 'concept', 'algorithm', 'equation', 'formula', 'law', 'theorem',
        'process', 'method', 'technique', 'analysis', 'synthesis', 'research', 'study', 'learning',
        'science', 'math', 'physics', 'chemistry', 'biology', 'history', 'geography', 'literature',
        'programming', 'coding', 'computer', 'technology', 'engineering', 'medicine', 'anatomy'
    ]
    
    has_educational_keyword = any(keyword in topic_lower for keyword in educational_keywords)
    
    # If it has educational keywords, it's probably valid
    if has_educational_keyword:
        return {'is_valid': True}
    
    # Check for technical/scientific suffixes
    technical_suffixes = ['ism', 'ology', 'tion', 'sion', 'ment', 'ness', 'ics', 'ing']
    has_technical_suffix = any(topic_lower.endswith(suffix) for suffix in technical_suffixes)
    
    # Allow if multiple words, longer than common names, or has technical suffix
    if len(words) > 1 or len(topic_lower) > 8 or has_technical_suffix:
        return {'is_valid': True}
    
    # Final fallback - if we're not sure, suggest being more specific
    return {
        'is_valid': False,
        'error': f'"{topic}" might be too vague. Please be more specific about the educational concept you\'d like to learn about.'
    }

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

def validate_ai_response(explanation, original_topic):
    """
    Validate AI response to detect if the AI identified the input as invalid
    This catches cases where validation was bypassed but AI correctly identified non-educational content
    """
    if not explanation:
        return False
    
    explanation_lower = explanation.lower()
    
    # Check for indicators that AI identified this as a personal name or invalid topic
    invalid_indicators = [
        "appears to be a person's name",
        "looks like a personal name",
        "seems to be someone's name",
        "is a person's name",
        "this is a name",
        "individual's name",
        "appears to be asking about a person",
        "this seems to be a personal name",
        "i can't provide information about specific individuals",
        "i don't have information about this person",
        "this appears to be a personal query",
        "seems like a personal name",
        "looks like you're asking about a person",
        "this appears to be about a specific person",
        "i cannot provide personal information",
        "appears to be requesting information about an individual"
    ]
    
    # Check if AI response contains any invalid indicators
    for indicator in invalid_indicators:
        if indicator in explanation_lower:
            print(f"AI response validation failed: Found indicator '{indicator}' in response for topic '{original_topic}'")
            return False
    
    # Check if response is too short or seems like an error message
    if len(explanation.strip()) < 100:
        # Very short responses might indicate the AI refused to answer
        refusal_phrases = [
            "i can't",
            "i cannot",
            "i'm not able",
            "i don't have",
            "not appropriate",
            "cannot provide",
            "unable to provide"
        ]
        
        for phrase in refusal_phrases:
            if phrase in explanation_lower:
                print(f"AI response validation failed: Found refusal phrase '{phrase}' in short response for topic '{original_topic}'")
                return False
    
    return True

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
    
    # Enhanced Gemini-optimized prompts with better formatting and engagement
    level_prompts = {
        "eli5": """You are ConceptAI 🤖, an expert educator specializing in making complex concepts accessible to children. Create a fun, engaging explanation using simple language, creative analogies, and a sprinkle of emojis to keep it lively!

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for main topics, #### for subtopics
• Lists: Use numbered lists (1. 2. 3.) for steps/sequences, use bullet points (-) for features/characteristics  
• Code: Wrap code/formulas in `backticks` for inline, ```language blocks``` for multi-line
• Emphasis: Use **bold** for key terms, _italics_ for definitions
• Emojis: Use 1-3 relevant emojis per section to make it engaging (🔬 for science, 💡 for ideas, 🌟 for cool facts, etc.)
• Tables: Only use when comparing multiple items or showing structured data. ALWAYS place on separate lines with blank lines before and after. Use | Column 1 | Column 2 | format with |---------|---------|
• Math: Use \\( formula \\) for inline math, \\[ formula \\] for display math

IMPORTANT GUIDELINES:
- Use emojis sparingly but effectively - 1-3 per section maximum
- Focus on simple analogies that a 5-year-old could understand (like comparing things to toys, animals, or everyday objects)
- Use tables ONLY when they genuinely help compare or organize information
- Most explanations should focus on storytelling, analogies, and simple lists rather than tables
- Make it feel like a friendly conversation, not a textbook

STRUCTURE your explanation with:
### 🌟 What is [Topic]?
### ⚙️ How it Works (with fun analogies)
### 🎯 Why it's Important  
### 🎮 Fun Examples

Keep it playful, visual, and super easy to understand! Think of explaining it to a curious 5-year-old who loves learning new things! 🚀""",

        "student": """You are ConceptAI, an expert academic tutor creating clear, structured explanations for high school and early college students. Focus on building solid understanding with practical examples and real-world connections.

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for main sections, #### for subsections, ##### for specific topics
• Lists: Use numbered lists (1. 2. 3.) for procedures/steps, bullet points (-) for key concepts
• Code: Use `backticks` for terms/variables, ```language blocks``` for code examples
• Emphasis: Use **bold** for important concepts, _italics_ for technical terms
• Tables: Use only when comparing data, features, or multiple examples would be clearer than lists
• Math: Use \\( x = y \\) for inline formulas, \\[ equations \\] for display math

IMPORTANT GUIDELINES:
- Focus on conceptual understanding before diving into details
- Use real-world examples that students can relate to
- Tables should be used sparingly - only when they genuinely help organize comparative information
- Connect concepts to practical applications and career relevance
- Strike a balance between accessibility and academic rigor

STRUCTURE your explanation with:
### 📚 Definition and Overview
### 🧩 Key Components
### ⚡ How It Works
### 🌍 Real-World Applications
### 💼 Career Connections
### 📝 Common Examples

Balance clarity with appropriate detail level while keeping students engaged!""",

        "graduate": """You are ConceptAI, an expert academic providing comprehensive graduate-level explanations. Include theoretical foundations, technical details, research context, and critical analysis with academic rigor.

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for major sections, #### for subsections, ##### for detailed topics
• Lists: Use numbered lists (1. 2. 3.) for methodologies/processes, bullet points (-) for principles/features
• Code: Use `technical terms`, ```language syntax``` for algorithms/implementations
• Emphasis: Use **bold** for core concepts, _italics_ for theoretical terms
• Tables: Use only when detailed comparisons or structured data analysis adds significant value
• Math: Use \\( notation \\) for inline math, \\[ complex equations \\] for proofs/derivations

IMPORTANT GUIDELINES:
- Provide comprehensive theoretical foundation with proper academic context
- Include references to key research and methodological approaches
- Tables should be reserved for complex comparisons, parameter analysis, or structured research data
- Focus on critical analysis and theoretical depth rather than basic explanations
- Connect to current research trends and academic discourse

STRUCTURE your explanation with:
### 🔬 Theoretical Foundation
### 🛠️ Technical Implementation
### 📊 Mathematical Framework (if applicable)
### 📖 Research Context and Literature
### 🎯 Advanced Applications
### 📈 Current Developments
### 🔮 Future Research Directions

Provide comprehensive coverage with academic rigor suitable for graduate-level study!""",

        "advanced": """You are ConceptAI, an expert researcher providing cutting-edge explanations for professionals and industry experts. Include latest research, complex implementations, performance analysis, and professional-grade insights.

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for major domains, #### for technical areas, ##### for specific implementations
• Lists: Use numbered lists (1. 2. 3.) for methodologies/algorithms, bullet points (-) for insights/findings
• Code: Use `specialized notation`, ```language implementations``` for production code
• Emphasis: Use **bold** for critical concepts, _italics_ for research terminology  
• Tables: Use only for comprehensive analysis when comparing multiple parameters, methodologies, or research findings
• Math: Use \\( advanced notation \\) inline, \\[ complex derivations \\] for mathematical proofs

IMPORTANT GUIDELINES:
- Focus on state-of-the-art developments and cutting-edge research
- Include performance metrics, scalability considerations, and implementation challenges
- Tables should be reserved for detailed technical comparisons, research summaries, or parameter analysis
- Emphasize practical implications for industry professionals
- Discuss limitations, trade-offs, and future directions

STRUCTURE your explanation with:
### 🚀 State-of-the-Art Overview
### 🏗️ Technical Architecture
### 🧠 Advanced Methodologies
### 🔬 Research Frontiers
### 🏢 Industry Applications
### ⚡ Performance Analysis
### 🎯 Implementation Challenges
### 🔮 Future Directions

Provide expert-level depth with cutting-edge insights for professional practitioners!"""
    }
    
    system_prompt = level_prompts.get(level.lower(), level_prompts["student"])
    
    # Generous token limits since Google AI Studio is fast and reliable
    max_tokens = 2000  # Much higher limit for all levels
    
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
    
    # Enhanced prompts matching Google AI Studio implementation
    level_prompts = {
        "eli5": """You are ConceptAI 🤖, an expert educator specializing in making complex concepts accessible to children. Create a fun, engaging explanation using simple language, creative analogies, and a sprinkle of emojis to keep it lively!

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for main topics, #### for subtopics
• Lists: Use numbered lists (1. 2. 3.) for steps/sequences, use bullet points (-) for features/characteristics  
• Code: Wrap code/formulas in `backticks` for inline, ```language blocks``` for multi-line
• Emphasis: Use **bold** for key terms, _italics_ for definitions
• Emojis: Use 1-3 relevant emojis per section to make it engaging (🔬 for science, 💡 for ideas, 🌟 for cool facts, etc.)
• Tables: Only use when comparing multiple items or showing structured data. ALWAYS place on separate lines with blank lines before and after. Use | Column 1 | Column 2 | format with |---------|---------|
• Math: Use \\( formula \\) for inline math, \\[ formula \\] for display math

IMPORTANT GUIDELINES:
- Use emojis sparingly but effectively - 1-3 per section maximum
- Focus on simple analogies that a 5-year-old could understand (like comparing things to toys, animals, or everyday objects)
- Use tables ONLY when they genuinely help compare or organize information
- Most explanations should focus on storytelling, analogies, and simple lists rather than tables
- Make it feel like a friendly conversation, not a textbook

STRUCTURE your explanation with:
### 🌟 What is [Topic]?
### ⚙️ How it Works (with fun analogies)
### 🎯 Why it's Important  
### 🎮 Fun Examples

Keep it playful, visual, and super easy to understand! Think of explaining it to a curious 5-year-old who loves learning new things! 🚀""",

        "student": """You are ConceptAI, an expert academic tutor creating clear, structured explanations for high school and early college students. Focus on building solid understanding with practical examples and real-world connections.

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for main sections, #### for subsections, ##### for specific topics
• Lists: Use numbered lists (1. 2. 3.) for procedures/steps, bullet points (-) for key concepts
• Code: Use `backticks` for terms/variables, ```language blocks``` for code examples
• Emphasis: Use **bold** for important concepts, _italics_ for technical terms
• Tables: Use only when comparing data, features, or multiple examples would be clearer than lists
• Math: Use \\( x = y \\) for inline formulas, \\[ equations \\] for display math

IMPORTANT GUIDELINES:
- Focus on conceptual understanding before diving into details
- Use real-world examples that students can relate to
- Tables should be used sparingly - only when they genuinely help organize comparative information
- Connect concepts to practical applications and career relevance
- Strike a balance between accessibility and academic rigor

STRUCTURE your explanation with:
### 📚 Definition and Overview
### 🧩 Key Components
### ⚡ How It Works
### 🌍 Real-World Applications
### 💼 Career Connections
### 📝 Common Examples

Balance clarity with appropriate detail level while keeping students engaged!

STRUCTURE your explanation with:
### Definition and Overview
### Key Components
### How It Works
### Real-World Applications
### Common Examples

Balance clarity with appropriate detail level.""",

        "graduate": """You are ConceptAI, an expert academic providing comprehensive graduate-level explanations. Include theoretical foundations, technical details, research context, and critical analysis with academic rigor.

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for major sections, #### for subsections, ##### for detailed topics
• Lists: Use numbered lists (1. 2. 3.) for methodologies/processes, bullet points (-) for principles/features
• Code: Use `technical terms`, ```language syntax``` for algorithms/implementations
• Emphasis: Use **bold** for core concepts, _italics_ for theoretical terms
• Tables: Use only when detailed comparisons or structured data analysis adds significant value
• Math: Use \\( notation \\) for inline math, \\[ complex equations \\] for proofs/derivations

IMPORTANT GUIDELINES:
- Provide comprehensive theoretical foundation with proper academic context
- Include references to key research and methodological approaches
- Tables should be reserved for complex comparisons, parameter analysis, or structured research data
- Focus on critical analysis and theoretical depth rather than basic explanations
- Connect to current research trends and academic discourse

STRUCTURE your explanation with:
### 🔬 Theoretical Foundation
### 🛠️ Technical Implementation
### 📊 Mathematical Framework (if applicable)
### 📖 Research Context and Literature
### 🎯 Advanced Applications
### 📈 Current Developments
### 🔮 Future Research Directions

Provide comprehensive coverage with academic rigor suitable for graduate-level study!""",

        "advanced": """You are ConceptAI, an expert researcher providing cutting-edge explanations for professionals and industry experts. Include latest research, complex implementations, performance analysis, and professional-grade insights.

FORMATTING REQUIREMENTS - Use these EXACT formats:
• Headers: Use ### for major domains, #### for technical areas, ##### for specific implementations
• Lists: Use numbered lists (1. 2. 3.) for methodologies/algorithms, bullet points (-) for insights/findings
• Code: Use `specialized notation`, ```language implementations``` for production code
• Emphasis: Use **bold** for critical concepts, _italics_ for research terminology  
• Tables: Use only for comprehensive analysis when comparing multiple parameters, methodologies, or research findings
• Math: Use \\( advanced notation \\) inline, \\[ complex derivations \\] for mathematical proofs

IMPORTANT GUIDELINES:
- Focus on state-of-the-art developments and cutting-edge research
- Include performance metrics, scalability considerations, and implementation challenges
- Tables should be reserved for detailed technical comparisons, research summaries, or parameter analysis
- Emphasize practical implications for industry professionals
- Discuss limitations, trade-offs, and future directions

STRUCTURE your explanation with:
### 🚀 State-of-the-Art Overview
### 🏗️ Technical Architecture
### 🧠 Advanced Methodologies
### 🔬 Research Frontiers
### 🏢 Industry Applications
### ⚡ Performance Analysis
### 🎯 Implementation Challenges
### 🔮 Future Directions

Provide expert-level depth with cutting-edge insights for professional practitioners!"""
    }
    
    system_prompt = level_prompts.get(level.lower(), level_prompts["student"])
    
    # Generous token limits since Google AI Studio is fast and reliable
    max_tokens = 2000  # Much higher limit for all levels
    
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
        "max_tokens": max_tokens,  # High limit for detailed explanations
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
        
        # NEW: Server-side educational concept validation for security
        validation_result = validate_educational_concept(topic)
        if not validation_result['is_valid']:
            return jsonify({'error': validation_result['error']}), 400
        
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
        
        # NEW: Validate AI response to catch invalid topics that bypassed validation
        is_valid_response = validate_ai_response(explanation, topic)
        
        if not is_valid_response:
            # AI identified this as invalid (e.g., personal name) - don't save to cache or analytics
            print(f"AI response validation failed for topic: {topic}")
            return jsonify({
                'error': 'This appears to be a personal name or non-educational topic. Please ask about educational concepts, scientific topics, or academic subjects instead.',
                'ai_detected_invalid': True
            }), 400
        
        # Only save to cache if AI response is valid educational content
        try:
            save_explanation(topic, level, explanation)
            print(f"Valid educational content saved for topic: {topic}")
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

@app.route('/delete-topic', methods=['DELETE'])
def delete_topic():
    """Delete a specific topic from history and cache"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        topic = data.get('topic', '').strip()
        level = data.get('level', '').strip()
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        if not level:
            return jsonify({'error': 'Level is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Normalize the topic for consistent deletion
        normalized_topic = normalize_topic(topic)
        
        # Delete the specific topic and level combination
        cursor.execute(
            'DELETE FROM explanations WHERE topic = ? AND level = ?',
            (normalized_topic, level.lower())
        )
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        if deleted_count > 0:
            print(f"Deleted topic: {normalized_topic}, level: {level}")
            return jsonify({
                'message': f'Successfully deleted "{topic}" at {level} level',
                'deleted': True
            })
        else:
            return jsonify({
                'message': f'Topic "{topic}" at {level} level not found',
                'deleted': False
            }), 404
        
    except Exception as e:
        print(f"Error deleting topic: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

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
