"""
Test what Ollama actually returns
"""
import requests
import base64
import tempfile

def test_ollama_json_response():
    """Test if Ollama can return JSON"""
    try:
        # Create a minimal test image
        minimal_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        
        temp_path = tempfile.mktemp(suffix='.png')
        with open(temp_path, 'wb') as f:
            f.write(minimal_png)
        
        print(f"Test image created: {temp_path}")
        
        # Test with a simple JSON prompt
        with open(temp_path, 'rb') as f:
            image_data = f.read()
        
        payload = {
            "model": "gemma3:4b",
            "prompt": "You are a JSON API. Return ONLY a JSON object with this exact format: {\"verdict\": \"test\", \"confidence\": 50, \"reasons\": [\"test reason\"]}. No other text.",
            "images": [base64.b64encode(image_data).decode('utf-8')],
            "stream": False
        }
        
        print("Sending request to Ollama...")
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=payload,
            timeout=60
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get("response", "")
            print(f"Response text: {response_text}")
            print(f"Response length: {len(response_text)}")
            
            # Try to parse as JSON
            try:
                import json
                parsed = json.loads(response_text)
                print(f"Parsed JSON: {parsed}")
            except:
                print("Response is not valid JSON")
        
        # Clean up
        import os
        os.unlink(temp_path)
        
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ollama_json_response()