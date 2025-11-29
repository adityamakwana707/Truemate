#!/bin/bash
# Install required packages for deepfake detection

echo "🚀 Installing required packages for deepfake detection..."

cd "$(dirname "$0")"

# Install Python packages
pip install langchain-google-genai langchain-core Pillow

echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure your Google API key is set in the .env file"
echo "2. Start the ML service: python ultimate_working_service.py"
echo "3. Start the Next.js frontend: npm run dev"
echo ""
echo "🎯 Features now available:"
echo "• Advanced deepfake detection with ELA analysis"
echo "• Multi-modal AI analysis using Gemini Vision"
echo "• Metadata extraction and forensic analysis"
echo "• Visual anomaly detection"
echo "• Comprehensive authenticity scoring"