"""
TruthMate Integration Test Script
Tests the connection between Next.js API and Flask ML service
"""
import requests
import json
import sys

def test_flask_health():
    """Test Flask service health directly"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Flask ML service is running")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Flask service returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Flask service not reachable: {e}")
        return False

def test_nextjs_health():
    """Test Next.js API health endpoint"""
    try:
        response = requests.get("http://localhost:3000/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Next.js API is running")
            print(f"   ML Service Status: {data['services']['ml_service']}")
            return data['services']['ml_service'] in ['healthy', 'model_loaded']
        else:
            print(f"❌ Next.js API returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Next.js API not reachable: {e}")
        return False

def test_verification_pipeline():
    """Test the complete verification pipeline"""
    try:
        test_claim = "The COVID-19 vaccine is effective at preventing severe illness"
        
        response = requests.post("http://localhost:3000/api/verify", 
                               json={"text": test_claim, "public": True},
                               timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Verification pipeline works!")
            print(f"   Claim: {data.get('claim', 'N/A')}")
            print(f"   Verdict: {data.get('verdict', 'N/A')}")
            print(f"   Confidence: {data.get('confidence', 'N/A')}%")
            print(f"   Verification ID: {data.get('verificationId', 'N/A')}")
            return True
        else:
            print(f"❌ Verification failed with {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Verification pipeline error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 TruthMate Integration Test")
    print("=" * 40)
    
    # Test Flask service
    flask_ok = test_flask_health()
    print()
    
    # Test Next.js API
    nextjs_ok = test_nextjs_health()
    print()
    
    # Test full pipeline if both services are running
    if flask_ok and nextjs_ok:
        pipeline_ok = test_verification_pipeline()
        print()
        
        if pipeline_ok:
            print("🎉 All systems working! Your TruthMate integration is ready!")
        else:
            print("⚠️  Services are running but pipeline has issues")
    else:
        print("⚠️  Some services are not running properly")
        if not flask_ok:
            print("   → Start Flask: cd ml-service && python app.py")
        if not nextjs_ok:
            print("   → Start Next.js: npm run dev")
    
    print("\n📋 Next Steps:")
    print("   1. Make sure both services are running")
    print("   2. Visit http://localhost:3000/dashboard")
    print("   3. Submit a claim to test the full pipeline")
    print("   4. Check the results page for AI-powered analysis")