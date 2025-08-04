from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import AzureOpenAI
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class ChatBot:
    def __init__(self):
        # Configuration
        self.workspace_id = os.getenv("WORKSPACE_ID")
        self.model_name = os.getenv("MODEL_NAME")
        self.asset_id = os.getenv("ASSET_ID")
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "https://eais2-use.int.thomsonreuters.com")
        self.token_url = os.getenv("TOKEN_URL", "https://aiplatform.gcs.int.thomsonreuters.com/v1/openai/token")
        
        self.client = None
        self.headers = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Azure OpenAI client with credentials"""
        try:
            payload = {
                "workspace_id": self.workspace_id,
                "model_name": self.model_name
            }
            
            # Get credentials
            resp = requests.post(self.token_url, json=payload)
            credentials = json.loads(resp.content)
            
            if "openai_key" in credentials and "openai_endpoint" in credentials:
                openai_api_key = credentials["openai_key"]
                openai_deployment_id = credentials["azure_deployment"]
                openai_api_version = credentials["openai_api_version"]
                token = credentials["token"]
                llm_profile_key = openai_deployment_id.split("/")[0]
                
                # Set up headers
                self.headers = {
                    "Authorization": f"Bearer {token}",
                    "api-key": openai_api_key,
                    "Content-Type": "application/json",
                    "x-tr-chat-profile-name": "ai-platforms-chatprofile-prod",
                    "x-tr-userid": self.workspace_id,
                    "x-tr-llm-profile-key": llm_profile_key,
                    "x-tr-user-sensitivity": "true",
                    "x-tr-sessionid": openai_deployment_id,
                    "x-tr-asset-id": self.asset_id,
                    "x-tr-authorization": self.openai_base_url
                }
                
                # Initialize the AzureOpenAI client
                self.client = AzureOpenAI(
                    azure_endpoint=self.openai_base_url,
                    api_key=openai_api_key,
                    api_version=openai_api_version,
                    azure_deployment=openai_deployment_id,
                    default_headers=self.headers
                )
                
                print("✅ Azure OpenAI client initialized successfully")
            else:
                raise Exception("Failed to retrieve OpenAI credentials")
                
        except Exception as e:
            print(f"❌ Error initializing client: {str(e)}")
            raise e
    
    def get_response(self, message, conversation_history=None):
        """Get response from Azure OpenAI"""
        try:
            # Build messages array
            messages = []
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)
            
            # Add current user message
            messages.append({"role": "user", "content": message})
            
            # Get response from Azure OpenAI
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ Error getting response: {str(e)}")
            raise e

# Initialize chatbot
chatbot = ChatBot()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Backend is running"}), 200

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        user_message = data['message']
        conversation_history = data.get('history', [])
        
        # Get response from chatbot
        bot_response = chatbot.get_response(user_message, conversation_history)
        
        return jsonify({
            "response": bot_response,
            "status": "success"
        }), 200
        
    except Exception as e:
        print(f"❌ Chat endpoint error: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your request",
            "details": str(e)
        }), 500

@app.route('/refresh-credentials', methods=['POST'])
def refresh_credentials():
    """Refresh Azure OpenAI credentials"""
    try:
        chatbot._initialize_client()
        return jsonify({"message": "Credentials refreshed successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to refresh credentials: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Thomson Reuters CoCounsel Backend...")
    print(f"📡 Server will run on http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)