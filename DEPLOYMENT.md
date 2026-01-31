# Deployment Guide - Render.com

This guide will help you deploy Story Point Poker to Render.com for free.

## Prerequisites

- GitHub account with your repository pushed
- Render.com account (free) - Sign up at https://render.com

## Deployment Steps

### Step 1: Prepare Your Repository

Your code is already configured for Render deployment! The following files have been set up:

- `render.yaml` - Render configuration
- Updated `server/server.js` - Serves static files in production
- Updated `client/src/App.vue` - Dynamic WebSocket URL
- Root `package.json` - Build scripts

### Step 2: Push Changes to GitHub

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 3: Deploy on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign up or log in with your GitHub account

2. **Create New Web Service**
   - Click "New +" button in top right
   - Select "Web Service"

3. **Connect Your Repository**
   - Click "Connect account" to authorize GitHub
   - Find and select `story-point-poker` repository
   - Click "Connect"

4. **Configure Service** (Use these settings)
   - **Name**: `story-point-poker` (or your preferred name)
   - **Region**: Choose closest to you (Singapore, Oregon, Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```
     cd client && yarn install && yarn build && cd ../server && yarn install
     ```
   - **Start Command**: 
     ```
     cd server && node server.js
     ```
   - **Plan**: Select **Free**

5. **Environment Variables** (Optional)
   - Click "Advanced" to add environment variables if needed
   - `NODE_ENV` is automatically set to `production`
   - `PORT` is automatically provided by Render

6. **Create Web Service**
   - Click "Create Web Service"
   - Render will start building and deploying your app
   - This takes 3-5 minutes for the first deployment

### Step 4: Access Your App

Once deployment is complete:

1. Render will provide a URL like: `https://story-point-poker-xxxx.onrender.com`
2. Click the URL to open your app
3. Share this URL with your team!

## Using the Deployed App

### First Time Setup

1. Open the Render URL
2. First person to join becomes the host
3. Host configures Jira settings:
   - **Domain**: `yourcompany.atlassian.net`
   - **Email**: Your Jira email
   - **API Token**: Generate from https://id.atlassian.com/manage-profile/security/api-tokens
   - **Project Key**: Your Jira project (e.g., `PROJ`)
   - **Story Points Field**: Custom field ID (default: `customfield_10016`)

4. Fetch tickets and start voting!

### Sharing with Team

Simply share the Render URL with your team members. They can:
- Join with their name
- See real-time updates
- Vote on story points
- Collaborate in planning sessions

## Important Notes

### Free Tier Limitations

- **Spin down after 15 minutes of inactivity**
  - First request after inactivity takes ~30 seconds to wake up
  - Not ideal for always-on use, but perfect for planning sessions

- **750 hours/month free** (plenty for team use)

- **Automatic HTTPS** included

### Automatic Deployments

Every time you push to `main` branch, Render will automatically:
1. Build the client
2. Deploy the server
3. Update your live app

### Custom Domain (Optional)

To use your own domain:
1. Go to service Settings
2. Add Custom Domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

**Error**: `yarn: command not found`
- Solution: Render should have yarn installed. Try rebuilding or use npm instead

**Error**: Build timeout
- Solution: Free tier has build timeout. Try again or optimize build

### App Not Loading

**Error**: White screen or connection error
- Check that build completed successfully
- Wait 30 seconds if app was sleeping
- Check browser console for errors

### WebSocket Not Connecting

**Error**: WebSocket connection failed
- Ensure URL uses `wss://` (automatic with HTTPS)
- Check Render logs for server errors
- Verify server started correctly

### Jira Integration Issues

**Error**: Cannot fetch tickets
- Verify Jira credentials are correct
- Check API token hasn't expired
- Ensure project key exists
- Verify permissions in Jira

## Viewing Logs

To debug issues:
1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab
4. View real-time logs

## Alternative Deployment Methods

If you need different hosting:

### Option 1: Deploy to Railway.app

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### Option 3: Deploy to VPS (DigitalOcean, AWS, etc.)

```bash
# On your VPS
git clone git@github.com:Cheng-Kai-Ming/story-point-poker.git
cd story-point-poker
yarn install:all
yarn build
yarn start
```

## Updating Your Deployment

To deploy changes:

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# Render automatically deploys!
```

## Cost Considerations

**Free Tier** (Perfect for small teams):
- ✅ Unlimited apps
- ✅ 750 hours/month
- ✅ Auto HTTPS
- ✅ Auto deploys
- ⚠️ Spins down after 15min inactivity

**Paid Plans** (If you need always-on):
- **Starter**: $7/month - stays always active
- **Standard**: $25/month - more resources

For most team planning sessions, **free tier is sufficient**!

## Support

If you encounter issues:
- Check Render status: https://status.render.com
- Render docs: https://render.com/docs
- Open an issue on GitHub

## Next Steps

1. Push your code to GitHub
2. Deploy on Render (5 minutes)
3. Share URL with team
4. Start planning!

Happy planning! 🎯
