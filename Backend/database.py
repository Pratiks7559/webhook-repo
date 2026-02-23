from flask_pymongo import PyMongo
import os
import re

def get_mongo_uri():
    """Get and fix MongoDB URI - handle special characters in password"""
    uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/webhook_db')
    
    # For mongodb+srv:// connections, use a different approach
    if uri.startswith('mongodb+srv://'):
        # Extract credentials and encode them
        match = re.match(r'mongodb\+srv://([^:]+):(.+)@(.+)', uri)
        if match:
            username = match.group(1)
            password = match.group(2)
            rest = match.group(3)
            from urllib.parse import quote_plus
            uri = f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}@{rest}"
    
    return uri

# Get MongoDB URI
MONGODB_URI = get_mongo_uri()

print(f"📦 MongoDB URI: {MONGODB_URI}")

# Create PyMongo instance
mongo = PyMongo()

def init_db(app):
    """Initialize the database with the Flask app"""
    app.config['MONGO_URI'] = MONGODB_URI
    
    try:
        mongo.init_app(app)
        
        # Test connection and create database/collection if not exists
        with app.app_context():
            # Ping to test connection
            mongo.db.command('ping')
            print("✅ MongoDB Connected Successfully!")
            
            # Explicitly create the events collection
            # This ensures the database and collection exist
            db = mongo.db
            if 'events' not in db.list_collection_names():
                db.create_collection('events')
                print("✅ Created 'events' collection!")
            else:
                print("✅ 'events' collection already exists!")
                
            # Count documents to verify
            count = db.events.count_documents({})
            print(f"📊 Current document count in events collection: {count}")
            
        return True
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
        print("⚠️ Please check:")
        print("   1. Is MongoDB running? (run 'mongod' or check MongoDB Atlas)")
        print("   2. Is the MONGODB_URI correct in .env file?")
        print(f"   3. Current URI: {MONGODB_URI}")
        return False

def get_db():
    """Get the database instance"""
    return mongo.db

def get_collection():
    """Get the events collection explicitly"""
    return mongo.db.events
