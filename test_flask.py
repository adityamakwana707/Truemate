"""
Quick test to verify Flask service is working
"""
import requests
import json

def test_flask():
    try:
        # Test health
        print("Testing health endpoint...")
        health_response = requests.get("http://localhost:5000/health")
        print(f"Health status: {health_response.status_code}")
        print(f"Health response: {health_response.text}")
        
        # Test verify
        print("\nTesting verify endpoint...")
        verify_data = {"text": "Test claim about coffee"}
        verify_response = requests.post("http://localhost:5000/verify", 
                                      json=verify_data,
                                      headers={'Content-Type': 'application/json'})
        print(f"Verify status: {verify_response.status_code}")
        print(f"Verify response: {verify_response.text}")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_flask()