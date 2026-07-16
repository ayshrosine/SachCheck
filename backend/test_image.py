"""
Test script to create a simple test image and test the upload flow
"""
import requests
import json
import tempfile

def create_test_image():
    """Create a simple test image using simple method"""
    # Create a minimal valid PNG file
    # This is a minimal 1x1 pixel PNG
    minimal_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    temp_path = tempfile.mktemp(suffix='.png')
    with open(temp_path, 'wb') as f:
        f.write(minimal_png)
    return temp_path

def test_upload():
    """Test the upload endpoint"""
    try:
        # Create test image
        print("Creating test image...")
        image_path = create_test_image()
        print(f"Test image created: {image_path}")
        
        # Test upload
        print("Testing upload to backend...")
        with open(image_path, 'rb') as f:
            files = {'file': ('test.png', f, 'image/png')}
            data = {'device_id': 'test-device-123'}
            
            response = requests.post(
                'http://localhost:8000/api/scan',
                files=files,
                data=data,
                timeout=120  # Give it more time for processing
            )
        
        print(f"Upload response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("Upload successful!")
            print(f"Verdict: {result.get('verdict')}")
            print(f"Confidence: {result.get('confidence')}")
            print(f"Reasons: {result.get('reasons')}")
            print(f"Model used: {result.get('model_used')}")
            print(f"Processing time: {result.get('processing_time_ms')}ms")
            return True
        else:
            print(f"Upload failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Clean up
        import os
        if 'image_path' in locals() and os.path.exists(image_path):
            os.unlink(image_path)
            print("Cleaned up test image")

if __name__ == "__main__":
    import sys
    success = test_upload()
    sys.exit(0 if success else 1)