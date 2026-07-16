"""
Simple test to check Ollama API connectivity
"""
import requests
import json

def test_ollama_connection():
    """Test basic Ollama API connection"""
    try:
        # Test basic generation
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma3:4b",
                "prompt": "Say hello in one word.",
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Ollama is working!")
            print(f"Response: {result.get('response', 'No response')}")
            return True
        else:
            print(f"Ollama API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Cannot connect to Ollama: {e}")
        return False

if __name__ == "__main__":
    import sys
    success = test_ollama_connection()
    sys.exit(0 if success else 1)