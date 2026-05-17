from mistralai.client import Mistral
import os
from dotenv import load_dotenv

load_dotenv()
client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])