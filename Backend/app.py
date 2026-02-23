import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
from enum import Enum
from database import mongo, init_db, get_db, get_collection

# 1. Load env variables
load_dotenv()

# 2. Set the Path to your Frontend folder (relative path for cross-platform compatibility)
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Frontend')
template_path = os.path.join(frontend_path, 'Template')
static_path = os.path.join(frontend_path, 'static')

# 3. Create the App ONCE with all settings
app = Flask(__name__, 
            template_folder=template_path, 
            static_folder=static_path,
            static_url_path='/static')

# Configure CORS with explicit settings to handle preflight requests
CORS(app, 
     resources={r"/events*": {"origins": "*"}, 
               r"/webhook": {"origins": "*"}},
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-GitHub-Event"])

# 4. Initialize Database using the database module
db_connected = init_db(app)

class Action(Enum):
    PUSH = 'PUSH'
    PULL_REQUEST = 'PULL_REQUEST'
    MERGE = 'MERGE'

# --- ROUTES ---

@app.route('/')
def index():
    # This will now look inside E:\web-repo\Frontend for index.html
    return render_template('index.html')

@app.route('/events', methods=['GET'])
def get_events():
    try:
        if not mongo or not db_connected:
            print("❌ Database not connected in /events")
            return jsonify({"error": "Database not connected"}), 503
        
        # Use the collection function for safer access
        collection = get_collection()
        
        # Get all events sorted by most recent first (using created_at field)
        events = list(collection.find().sort("created_at", -1).limit(10))
        
        # Convert ObjectId to string for JSON serialization
        for e in events: 
            e['_id'] = str(e['_id']) 
            
        print(f"✅ Fetched {len(events)} events from database") 
        return jsonify(events) 
    except Exception as e: 
        print(f"❌ Error fetching events: {str(e)}") 
        return jsonify({"error": str(e)}), 500

@app.route('/events/analytics', methods=['GET'])
def get_events_analytics():
    """
    Endpoint to fetch all events for analytics purposes.
    Returns all events without limit for accurate real-time analytics.
    """
    try:
        if not mongo or not db_connected:
            print("❌ Database not connected in /events/analytics")
            return jsonify({"error": "Database not connected"}), 503
        
        # Use the collection function for safer access
        collection = get_collection()
        
        # Get all events sorted by most recent first - no limit for analytics
        events = list(collection.find().sort("created_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for e in events: 
            e['_id'] = str(e['_id']) 
            # Convert created_at datetime to ISO string for proper serialization
            if 'created_at' in e and hasattr(e['created_at'], 'isoformat'):
                e['created_at'] = e['created_at'].isoformat()
            
        print(f"✅ Fetched {len(events)} events for analytics") 
        return jsonify(events) 
    except Exception as e: 
        print(f"❌ Error fetching analytics events: {str(e)}") 
        return jsonify({"error": str(e)}), 500

@app.route('/webhook', methods=['GET', 'POST']) 
def handle_webhook():
    # Handle GitHub ping/test request
    if request.method == 'GET':
        return jsonify({'message': 'Webhook is active!'}), 200
    
    try: 
        # Check if database is connected  
        if not mongo or not db_connected:  
            print("❌ Database unavailable during webhook processing")  
            return jsonify({'message': 'Database not available'}), 503  

        data = request.get_json()  

        if not data:   
            print("⚠️ No data provided in webhook request")    
            return jsonify({'message': 'No data provided'}), 400  

        event_type = request.headers.get('X-GitHub-Event')  

        print(f"📥 Received GitHub event type: {event_type}") 

        action_type = Action.PUSH.value   

        if event_type == 'pull_request':     
            if data.get('action') == 'closed' and data.get('pull_request', {}).get('merged'):         
                action_type = Action.MERGE.value       
            else:           
                action_type = Action.PULL_REQUEST.value    

        # Extraction Logic with fallback values   
        to_branch = data.get('ref', '').split('/')[-1] if event_type == 'push' else \
                    data.get('pull_request', {}).get('base', {}).get('ref', 'unknown')

        from_branch = data.get('pull_request', {}).get('head', {}).get('ref', 'unknown') \
                      if event_type != 'push' else ""

        event_document = {
            "author": data.get('sender', {}).get('login', 'Unknown'),
            "action": action_type,
            "from_branch": from_branch,
            "to_branch": to_branch,
            "timestamp": datetime.utcnow().strftime('%d %B %Y - %I:%M %p UTC'),
            "created_at": datetime.utcnow()  # For sorting
        }

        result = mongo.db.events.insert_one(event_document)
        event_document['_id'] = str(result.inserted_id)
        
        return jsonify({'message': 'Success', 'event': event_document}), 200
    except Exception as e:
        print(f"Error handling webhook: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

if __name__ == '__main__':
    # Debugging print to help you see if paths are correct
    print(f"Frontend Folder: {frontend_path}")
    app.run(debug=True, port=5000)
