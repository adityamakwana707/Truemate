/**
 * Integration test script for TruthMate Platform
 * Tests frontend-backend integration with the ML models
 */

const fetch = require('node-fetch');

const ML_SERVICE_URL = 'http://localhost:5000';
const FRONTEND_API_URL = 'http://localhost:3000/api/verify';

// Test claims for verification
const testClaims = [
    "The Earth is flat",
    "Water boils at 100°C at sea level",
    "COVID-19 vaccines contain microchips",
    "Regular exercise improves cardiovascular health"
];

async function testMLService() {
    console.log("🔬 Testing ML Service Direct Connection...\n");
    
    for (const claim of testClaims) {
        try {
            const response = await fetch(`${ML_SERVICE_URL}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: claim }),
                timeout: 10000
            });

            if (!response.ok) {
                console.log(`❌ ML Service Error for "${claim}": ${response.status}`);
                continue;
            }

            const result = await response.json();
            console.log(`✅ "${claim}"`);
            console.log(`   Verdict: ${result.label} (${result.confidence}% confidence)`);
            console.log(`   Explanation: ${result.explanation.substring(0, 100)}...`);
            console.log("");
        } catch (error) {
            console.log(`❌ ML Service Connection Error for "${claim}": ${error.message}`);
        }
    }
}

async function testFrontendAPI() {
    console.log("🌐 Testing Frontend API Integration...\n");
    
    for (const claim of testClaims) {
        try {
            const response = await fetch(FRONTEND_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: claim, 
                    public: true 
                }),
                timeout: 15000
            });

            if (!response.ok) {
                console.log(`❌ Frontend API Error for "${claim}": ${response.status}`);
                const errorText = await response.text();
                console.log(`   Error details: ${errorText}`);
                continue;
            }

            const result = await response.json();
            console.log(`✅ "${claim}"`);
            console.log(`   Verification ID: ${result.verificationId}`);
            console.log(`   Verdict: ${result.verdict} (${result.confidence}% confidence)`);
            console.log(`   Explanation: ${result.explanation.substring(0, 100)}...`);
            console.log(`   Evidence Sources: ${result.evidence?.length || 0}`);
            console.log(`   Harm Index: ${result.harmIndex}`);
            console.log("");
        } catch (error) {
            console.log(`❌ Frontend API Connection Error for "${claim}": ${error.message}`);
        }
    }
}

async function testHealthCheck() {
    console.log("❤️ Running Health Checks...\n");
    
    // Test ML Service Health
    try {
        const mlHealthResponse = await fetch(`${ML_SERVICE_URL}/health`, {
            timeout: 5000
        });
        
        if (mlHealthResponse.ok) {
            const mlHealth = await mlHealthResponse.json();
            console.log("✅ ML Service is healthy");
            console.log(`   Status: ${mlHealth.status}`);
            console.log(`   Models loaded: ${mlHealth.models_loaded}`);
        } else {
            console.log("❌ ML Service health check failed");
        }
    } catch (error) {
        console.log("❌ ML Service is not reachable:", error.message);
    }
    
    // Test Frontend API basic health
    try {
        const frontendResponse = await fetch(`${FRONTEND_API_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            timeout: 5000
        });
        
        // We expect a 400 error for empty body, which means the API is responding
        if (frontendResponse.status === 400) {
            console.log("✅ Frontend API is responding");
        } else {
            console.log(`⚠️ Frontend API unexpected response: ${frontendResponse.status}`);
        }
    } catch (error) {
        console.log("❌ Frontend API is not reachable:", error.message);
    }
    
    console.log("");
}

async function runFullIntegrationTest() {
    console.log("🚀 TruthMate Integration Test Suite");
    console.log("=====================================\n");
    
    await testHealthCheck();
    await testMLService();
    await testFrontendAPI();
    
    console.log("🎯 Integration Test Complete!");
    console.log("To start the services manually:");
    console.log("1. ML Service: cd ml-service && python production_sota_service.py");
    console.log("2. Frontend: npm run dev");
}

// Run the tests
if (require.main === module) {
    runFullIntegrationTest().catch(console.error);
}