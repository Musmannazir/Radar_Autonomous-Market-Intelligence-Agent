import os
from dotenv import load_dotenv

load_dotenv()

VERIFIER_PROVIDER = os.getenv("VERIFIER_PROVIDER", "ollama")  # "ollama" or "groq"
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
DB_PATH = "db/radar.sqlite"
MAX_LLM_CALLS_PER_RUN = 25 
GROQ_API_KEY = os.getenv("GROQ_API_KEY")