"""
Simple test script to verify Ollama integration
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.model_router import model_router
from app.schemas import Verdict

async def test_ollama_basic():
    """Test basic Ollama functionality"""
    print("Testing Ollama integration...")
    
    # Test with a simple text prompt first
    try:
        # Create a dummy file path for testing
        import tempfile
        import os
        
        # Create a simple text file for testing
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Test content for analysis")
            temp_file = f.name
        
        print(f"Created temp file: {temp_file}")
        
        # Test analysis (this will use Ollama since no API key is configured)
        result = await model_router.analyze(temp_file, "image", "image/jpeg")
        
        print(f"Analysis result:")
        print(f"  Verdict: {result.verdict}")
        print(f"  Confidence: {result.confidence}")
        print(f"  Reasons: {result.reasons}")
        print(f"  Model used: {result.model_used}")
        print(f"  Processing time: {result.processing_time_ms}ms")
        
        # Clean up
        os.unlink(temp_file)
        
        return True
        
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_ollama_basic())
    sys.exit(0 if success else 1)