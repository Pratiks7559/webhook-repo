# GitHub Webhook Project

A full-stack GitHub Webhook project using Flask, MongoDB, and a polling UI to track GitHub repository events.

## 📁 Project Structure

```
web-repo/
├── Backend/
│   ├── app.py              # Flask application with webhook endpoint
│   ├── database.py         # Database configuration
│   ├── models.py           # Data models
│   ├── Schema.py           # MongoDB schema
│   └── requirement.txt     # Python dependencies
├── Frontend/
│   ├── Template/
│   │   └── index.html      # Main HTML page
│   └── static/
│       ├── script.js       # Polling logic (15 seconds)
│       └── style.css       # UI styles
└── README.md               # This file
```

## 🛠️ Prerequisites

- Python 3.8+
- MongoDB (local or Atlas cloud)
- GitHub account
- ngrok (for local webhook testing)

## 🚀 Installation & Setup

### 1. Clone/Create Repositories

**action-repo** (your existing repository that will trigger webhooks):
```
bash
# Create or use an existing repository
# This repository will send webhook events
```

**webhook-repo** (this project):
```
bash
# This is the webhook-receiver project
```

### 2. Install Python Dependencies

```
bash
cd Backend
pip install -r requirement.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the Backend folder:

```
env
# MongoDB Connection String
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/webhook_db

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/webhook_db
```

### 4. Set Up MongoDB

**Option A: Local MongoDB**
- Download and install MongoDB Community Server
- Start MongoDB: `mongod`

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get your connection string
- Add your IP to the whitelist

### 5. Run the Flask Application

```
bash
cd Backend
python app.py
```

The server will start on `http://127.0.0.1:5000`

## 🔗 GitHub Webhook Setup

### 1. Set Up ngrok (for local testing)

```
bash
# Install ngrok
npm install ngrok -g

# Start ngrok tunnel to port 5000
ngrok http 5000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

### 2. Configure Webhook in GitHub

1. Go to your **action-repo** on GitHub
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Fill in the details:
   - **Payload URL**: `https://your-ngrok-url.ngrok.io/webhook`
   - **Content type**: `application/json`
   - **Events**: Select "Send me everything" or choose specific events:
     - Pushes
     - Pull requests
4. Click **Add webhook**

### 3. Test the Webhook

- Make a push to your action-repo
- Open a pull request
- Merge a pull request

Check the dashboard at `http://127.0.0.1:5000` to see the events.

## 📊 MongoDB Schema

Events are stored with the following structure:

```
json
{
  "author": "username",
  "action": "PUSH" | "PULL_REQUEST" | "MERGE",
  "from_branch": "source-branch",
  "to_branch": "target-branch",
  "timestamp": "15 January 2025 - 02:30 PM UTC",
  "created_at": datetime
}
```

## 🎨 UI Display Format

- **PUSH**: `{author} pushed to {to_branch} on {timestamp}`
- **PULL_REQUEST**: `{author} submitted a pull request from {from_branch} to {to_branch} on {timestamp}`
- **MERGE**: `{author} merged branch {from_branch} to {to_branch} on {timestamp}`

## 🔄 Polling

- Frontend polls the `/events` API every **15 seconds**
- Events are sorted by most recent first
- Displays up to 10 latest events

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify the connection string in `.env`
- For Atlas, ensure your IP is whitelisted

### Webhook Not Receiving Events
- Verify ngrok is running and URL is correct
- Check GitHub webhook delivery logs
- Ensure the `/webhook` endpoint is accessible

### Frontend Not Loading
- Check browser console for errors
- Verify Flask is running on port 5000

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Render the dashboard |
| `/events` | GET | Get latest 10 events |
| `/webhook` | POST | Receive GitHub webhook events |

## 🌍 Deployment (Optional)

### Deploy Backend to Render/Railway/Render

1. Push your code to GitHub
2. Connect to your deployment platform
3. Add environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
4. Deploy

### Update GitHub Webhook URL

After deployment, update your GitHub webhook payload URL to your production URL.

## 📄 License

MIT License
