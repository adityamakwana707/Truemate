/**
 * Test Next.js API client integration with enhanced ML service
 */

// Simple test without running full Next.js app
const testText = "BREAKING: Scientists discover miracle cure that eliminates all diseases in 24 hours!";

async function testMLServiceIntegration() {
    console.log("🧪 Testing Next.js ML Service Integration");
    console.log("=" + "=".repeat(45));

    try {
        // Test direct fetch to match Next.js API client
        const response = await fetch('http://127.0.0.1:5000/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: testText })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log("✅ API Integration Test Passed");
        console.log(`   Verdict: ${result.verdict}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        
        if (result.enhanced_analysis) {
            const enhanced = result.enhanced_analysis;
            console.log(`   Enhanced Analysis:`);
            console.log(`   - Consensus Score: ${(enhanced.consensus_score * 100).toFixed(1)}%`);
            console.log(`   - Risk Level: ${enhanced.risk_level}`);
            console.log(`   - Models: ${Object.keys(enhanced.model_predictions).length}`);
            console.log(`   - Processing Time: ${enhanced.processing_time_ms.toFixed(1)}ms`);
            
            console.log(`   Model Predictions:`);
            Object.entries(enhanced.model_predictions).forEach(([model, pred]) => {
                console.log(`   - ${model}: ${pred.prediction} (${(pred.confidence * 100).toFixed(1)}%)`);
            });
        }

        return true;
    } catch (error) {
        console.error("❌ API Integration Test Failed:", error.message);
        return false;
    }
}

// Run test
testMLServiceIntegration()
    .then(success => {
        console.log(success ? "\n🚀 Next.js Integration Ready!" : "\n❌ Integration Test Failed");
    })
    .catch(console.error);