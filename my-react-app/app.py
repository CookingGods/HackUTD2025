import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from chatbot import get_client, get_chat_response
import pandas as pd
import os

load_dotenv()

app = Flask(__name__)
CORS(app) 
client = get_client()
if isinstance(client, str):
    print(client)
    exit()

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

REGIONS = {
    "South": ["LA", "FL", "OK", "TX", "GA", "AR"],
    "Midwest": ["IL", "MI", "OH", "IN", "WI", "MN"],
    "West": ["NV", "CA", "AZ", "WA", "OR"],
    "Northeast": ["NY", "PA", "NJ", "MA", "CT"]
}

def filter_and_save_by_region(region_name, 
                             input_file='../tmobile_reviews_labeled.csv', 
                             output_file='filtered_data.csv'):
    df = pd.read_csv(input_file)
    
    if region_name == "All":
        df.to_csv(output_file, index=False)
        return f"Selected 'All'. Found {len(df)} records."

    if 'location' not in df.columns:
        raise KeyError("The CSV file is missing the 'location' column.")
        
    df.dropna(subset=['location'], inplace=True)
    
    df['state'] = df['location'].astype(str).str.split(', ').str[1]
    
    states_to_filter = REGIONS.get(region_name)
    
    if not states_to_filter:
        raise ValueError(f"Region '{region_name}' not found in REGIONS map.")

    filtered_df = df[df['state'].isin(states_to_filter)].copy()
    filtered_df.to_csv(output_file, index=False)
    return f"Filtered for {region_name}. Found {len(filtered_df)} records."



@app.route('/filter', methods=['POST', 'GET'])
def handle_filter_request():
    """
    This endpoint is triggered by your 'filter' button.
    It expects a 'region' parameter (e.g., 'South', 'Midwest').
    """
    region_name = request.args.get('region')
    
    if not region_name:
        return jsonify({"status": "error", "message": "No 'region' parameter provided."}), 400
        
    try:
        # Run the main filtering function
        message = filter_and_save_by_region(region_name)
        
        # If it returns without error, it was a success
        return jsonify({"status": "success", "message": message})
        
    except FileNotFoundError as e:
        # The 'tmobile_reviews_labeled.csv' wasn't found
        print(f"ERROR: File not found: {e}") # For your console
        return jsonify({"status": "error", "message": f"Data file not found: {e.filename}"}), 404
        
    except KeyError as e:
        # This will catch the "Missing 'Location' column" error
        print(f"ERROR: CSV data is missing a required column: {e}") # For your console
        return jsonify({"status": "error", "message": f"CSV data error. Missing required column: {e}"}), 400

    except ValueError as e:
        # This will catch the "Region not found" error we raised
        print(f"ERROR: Value error: {e}") # For your console
        return jsonify({"status": "error", "message": str(e)}), 400

    except PermissionError as e:
        # The app doesn't have rights to write 'filtered_data.csv'
        print(f"ERROR: Permission denied: {e}") # For your console
        return jsonify({"status": "error", "message": f"Server permission error: Cannot write file. {e}"}), 500
        
    except Exception as e:
        # The REAL "catch-all" for any other unexpected crash
        print(f"ERROR: An unexpected server error occurred: {e}") # For your console
        return jsonify({"status": "error", "message": f"An unexpected server error occurred: {e}"}), 500
    



@app.route('/get-filtered-data', methods=['GET'])
def get_filtered_data_for_graphs():
    """
    This endpoint reads the 'filtered_data.csv' file and returns
    its contents as JSON, ready to be used by charts.
    """
    try:
        # Read the pre-filtered data
        df = pd.read_csv('filtered_data.csv')
        
        # Convert the DataFrame to JSON in an 'records' orientation
        # (a list of objects), which is great for charting libraries.
        data_json = df.to_json(orient='records')
        
        # We parse the JSON string back into an object to return clean JSON
        import json
        return jsonify(json.loads(data_json))
        
    except FileNotFoundError:
        # This happens if /filter hasn't been called yet
        return jsonify({"error": "No filtered data found. Please select a region first."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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