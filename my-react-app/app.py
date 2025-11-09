import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from chatbot import get_client, get_chat_response

load_dotenv()

app = Flask(__name__)
CORS(app) 
client = get_client()
if isinstance(client, str):
    print(client)
    exit()

print("NVIDIA client initialized successfully.")

mock_data = {
    "complaints": [
        {"id": 101, "region": "NY", "text": "My 5G connection keeps dropping in midtown."},
        {"id": 102, "region": "CA", "text": "I was overcharged on my bill and customer service was no help."},
        {"id": 103, "region": "TX", "text": "Calls sound muffled and drop frequently in the Austin area."},
        {"id": 104, "region": "NY", "text": "Billing is confusing. Why do I have so many random fees?"},
        {"id": 105, "region": "CA", "text": "Network is fine, but the bill is a nightmare to read."}
    ]
}
data_string = json.dumps(mock_data, indent=2)
system_prompt = (
    "You are a T-Mobile internal assistant designed to assist T-Mobile "
    "use customer feedback to produce actionable insight. "
    "Use the data below to summarize the common complaint that T-Mobile users are facing.\n\n"
    "CUSTOMER FEEDBACK DATA:\n"
    f"{data_string}\n\n"
    "After your initial summary, answer any follow-up questions the user has about the data."
    "All responses should be at short and concise and be at most 3 sentences."
)

@app.route('/api/chat', methods=['POST'])
def chat():
    if isinstance(client, str):
        return jsonify({"error": client}), 500

    try:
        data = request.json
        user_messages = data.get('messages', [])

        if not user_messages:
            return jsonify({"error": "No messages provided"}), 400
        
        api_messages = [
            {"role": "system", "content": system_prompt}
        ] + user_messages
        bot_response = get_chat_response(client, api_messages)
        return jsonify({"response": bot_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)