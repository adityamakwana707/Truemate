"""
Test all endpoints that Next.js TruthMate app requires
"""

import requests
import json
import time

def test_all_endpoints():
    print("🧪 Testing All TruthMate ML Service Endpoints")
    print("=" * 55)
    
    base_url = "http://127.0.0.1:5000"
    test_text = "BREAKING: Scientists discover miracle cure that eliminates all diseases!"
    
    tests = [
        {
            "name": "Health Check",
            "method": "GET",
            "endpoint": "/health",
            "data": None
        },
        {
            "name": "Main Verify",
            "method": "POST", 
            "endpoint": "/verify",
            "data": {"text": test_text}
        },
        {
            "name": "Extract Claim",
            "method": "POST",
            "endpoint": "/extract-claim", 
            "data": {"text": test_text}
        },
        {
            "name": "Stance Detection",
            "method": "POST",
            "endpoint": "/stance-detection",
            "data": {"claim": test_text, "evidence_queries": ["cure diseases", "medical breakthrough"]}
        },
        {
            "name": "Source Credibility (empty queries)",
            "method": "POST",
            "endpoint": "/source-credibility",
            "data": {"queries": []}
        },
        {
            "name": "Source Credibility (with queries)",
            "method": "POST", 
            "endpoint": "/source-credibility",
            "data": {"queries": ["medical research", "health claims"]}
        },
        {
            "name": "Bias Sentiment",
            "method": "POST",
            "endpoint": "/bias-sentiment",
            "data": {"text": test_text}
        },
        {
            "name": "Generate Explanation",
            "method": "POST",
            "endpoint": "/generate-explanation", 
            "data": {
                "claim": test_text,
                "verdict": "False",
                "confidence": 0.8,
                "evidence": [],
                "credibility": 0.6,
                "bias": "high"
            }
        }
    ]
    
    success_count = 0
    
    for test in tests:
        print(f"\n🔍 Testing: {test['name']}")
        try:
            if test['method'] == 'GET':
                response = requests.get(f"{base_url}{test['endpoint']}", timeout=10)
            else:
                response = requests.post(
                    f"{base_url}{test['endpoint']}", 
                    json=test['data'],
                    timeout=10
                )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Status: {response.status_code}")
                
                # Show relevant response data
                if 'error' in result:
                    print(f"   ⚠️  Response: {result['error']}")
                elif test['endpoint'] == '/health':
                    print(f"   📊 Models: {result.get('total_models', 0)}")
                    print(f"   🎯 Status: {result.get('status', 'unknown')}")
                elif test['endpoint'] == '/verify':
                    print(f"   🎯 Verdict: {result.get('verdict', 'unknown')}")
                    print(f"   📈 Confidence: {result.get('confidence', 0):.2f}")
                elif test['endpoint'] == '/source-credibility':
                    print(f"   📊 Sources: {len(result.get('credible_sources', []))}")
                    print(f"   🎯 Avg Credibility: {result.get('avg_credibility', 0):.2f}")
                elif test['endpoint'] == '/generate-explanation':
                    explanation = result.get('explanation', '')
                    print(f"   📝 Explanation: {explanation[:60]}...")
                else:
                    print(f"   📋 Response keys: {list(result.keys())}")
                
                success_count += 1
                
            else:
                print(f"   ❌ Status: {response.status_code}")
                print(f"   📄 Response: {response.text[:100]}...")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print(f"\n{'🚀 All endpoints working!' if success_count == len(tests) else f'⚠️  {success_count}/{len(tests)} endpoints working'}")
    print(f"Success rate: {success_count/len(tests)*100:.1f}%")
    
    return success_count == len(tests)

if __name__ == "__main__":
    # Wait a moment for service to fully start
    time.sleep(2)
    test_all_endpoints()