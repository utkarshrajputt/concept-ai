import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
API_BASE_URL = "http://localhost:5000"
TEST_TOPIC = "Machine Learning"
TEST_LEVEL = "student"

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"Health Check Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_explain_endpoint():
    """Test the explain endpoint"""
    try:
        payload = {
            "topic": TEST_TOPIC,
            "level": TEST_LEVEL
        }
        
        response = requests.post(
            f"{API_BASE_URL}/explain",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Explain Endpoint Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Topic: {data.get('topic')}")
            print(f"Level: {data.get('level')}")
            print(f"Cached: {data.get('cached')}")
            print(f"Explanation Preview: {data.get('explanation', '')[:100]}...")
            return True
        else:
            print(f"Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"Explain endpoint test failed: {e}")
        return False

def test_cache_stats():
    """Test the cache stats endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/cache/stats")
        print(f"Cache Stats Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Cache stats test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Concept Simplifier API")
    print("=" * 40)
    
    # Check if OpenRouter API key is configured
    if not os.getenv('OPENROUTER_API_KEY'):
        print("⚠️  Warning: OPENROUTER_API_KEY not configured!")
        print("   Some tests may fail without a valid API key.")
    
    print("\n1. Testing Health Endpoint...")
    health_ok = test_health_endpoint()
    
    print("\n2. Testing Explain Endpoint...")
    explain_ok = test_explain_endpoint()
    
    print("\n3. Testing Cache Stats...")
    cache_ok = test_cache_stats()
    
    print("\n" + "=" * 40)
    print("🎯 Test Results:")
    print(f"   Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"   Explain API: {'✅ PASS' if explain_ok else '❌ FAIL'}")
    print(f"   Cache Stats: {'✅ PASS' if cache_ok else '❌ FAIL'}")
    
    if all([health_ok, explain_ok, cache_ok]):
        print("\n🎉 All tests passed! API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the backend server and configuration.")

if __name__ == "__main__":
    main()
