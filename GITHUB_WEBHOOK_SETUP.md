# GitHub Webhook Setup for Your Render App

## Step 1: Get Your Render URL
After deploying, get your live URL from Render Dashboard:
- Format: `https://your-service-name.onrender.com`

## Step 2: Create GitHub Webhook
1. Go to your GitHub repository: `https://github.com/Pratiks7559/webhook-repo`
2. Go to **Settings** → **Webhooks** → **Add webhook**
3. Fill in the details:

### Payload URL:
```
https://your-service-name.onrender.com/webhook
```

### Content type:
- Select **application/json**

### Events:
- Select **Let me select individual events**
- Check **Pushes** and **Pull requests**

### Active:
- Check **Active**

## Step 3: Add Webhook Secret (Optional but Recommended)
1. In your Render app environment variables, add:
   - Key: `WEBHOOK_SECRET`
   - Value: Create a random secret (e.g., using a password generator)

2. Update your app.py to verify the secret (optional security enhancement)

## Step 4: Test the Webhook
1. In the GitHub webhook settings, click **"Test"** button
2. Check your Render app logs to see if the webhook was received
3. Verify events appear in your application

## Notes:
- GitHub sends webhooks from IP: `140.82.112.0/20`
- Make sure your Render service allows incoming traffic
- Check Render logs if webhook isn't working
