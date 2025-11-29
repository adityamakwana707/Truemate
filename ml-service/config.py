import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Gemini API Settings - Try multiple key names
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    # Model Configuration
    MODEL_FAST = "gemini-1.5-flash"  # Fast model for quick analysis
    MODEL_REASONING = "gemini-1.5-flash-thinking-exp-1219"  # Reasoning model for complex analysis
    
    # Browser Settings
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

settings = Settings()