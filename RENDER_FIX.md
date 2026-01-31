# Render Deployment Quick Fix Guide

## ✅ Issue Fixed: ERR_MODULE_NOT_FOUND

The deployment error has been fixed with the following changes:

### What Was Wrong:
- Build/start commands were using `cd` which caused path issues on Render
- Dependencies weren't properly installed from the root directory
- Module resolution failed because Node couldn't find packages

### What Was Fixed:
1. **Updated `render.yaml`:**
   ```yaml
   buildCommand: yarn build
   startCommand: yarn start
   ```

2. **Updated `package.json`:**
   - Added `"type": "module"` for ES6 imports
   - Added `postinstall` script to install dependencies
   - Updated `start` command to run from root: `node server/server.js`
   - Updated `build` command to install all dependencies

3. **Updated `DEPLOYMENT.md`:**
   - Corrected build and start commands
   - Updated deployment instructions

### ✅ Verified Working:
- ✅ Build command tested locally
- ✅ Start command tested locally
- ✅ Server starts correctly in production mode
- ✅ Static files served correctly
- ✅ WebSocket connections work
- ✅ Security headers applied

---

## 🚀 Deploy to Render (Updated Instructions)

### Option 1: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard:** https://dashboard.render.com

2. **Click "New +" → "Web Service"**

3. **Connect Repository:**
   - Connect your GitHub account
   - Select `Cheng-Kai-Ming/story-point-poker`
   - Click "Connect"

4. **Service Configuration:**
   - **Name:** `story-point-poker`
   - **Environment:** `Node`
   - **Region:** Singapore (or closest to you)
   - **Branch:** `main`
   - **Build Command:** `yarn build`
   - **Start Command:** `yarn start`
   - **Plan:** Free

5. **Click "Create Web Service"**
   - Render will automatically deploy
   - Takes ~5 minutes
   - You'll get a URL like: `https://story-point-poker-xxxx.onrender.com`

### Option 2: Using render.yaml (Blueprint)

1. **Go to Render Dashboard:** https://dashboard.render.com

2. **Click "New +" → "Blueprint"**

3. **Connect Repository:**
   - Select `Cheng-Kai-Ming/story-point-poker`
   - Render will detect `render.yaml`
   - Click "Apply"

4. **Deploy automatically!**

---

## 🔍 Troubleshooting

### If deployment still fails:

#### 1. Check Build Logs
```
Dashboard → Your Service → Logs → Filter: Build
```

Look for:
- `yarn build` command execution
- `vite build` success message
- Dependencies installed correctly

#### 2. Check Runtime Logs
```
Dashboard → Your Service → Logs → Filter: Deploy
```

Look for:
- "Server is running on port XXXX"
- "Environment: production"
- No ERR_MODULE_NOT_FOUND errors

#### 3. Common Issues & Solutions

**Issue:** `Cannot find package 'ws'`
**Solution:** ✅ Fixed! The `yarn build` command now installs all dependencies

**Issue:** `Cannot find module 'server.js'`
**Solution:** ✅ Fixed! Start command now uses correct path: `node server/server.js`

**Issue:** `Build timeout`
**Solution:** Free tier has 10-minute build limit. This should complete in ~2 minutes.

**Issue:** `Port already in use`
**Solution:** Render provides PORT automatically. Don't hardcode port 8080.

**Issue:** `Static files not found`
**Solution:** Build creates `client/dist/`. Server looks for it at `../client/dist` from `server/server.js`

---

## ✅ Verification Checklist

After deployment, verify:

1. **Homepage loads:**
   - Visit your Render URL
   - Should see login page
   - No console errors

2. **WebSocket connects:**
   - Enter a username and join
   - Check browser console for "WebSocket connected"
   - Should show in user list

3. **Host can configure Jira:**
   - First user becomes host (crown icon)
   - Can open Jira configuration
   - Can save configuration

4. **Security headers present:**
   - Open DevTools → Network
   - Check response headers
   - Should see X-Frame-Options, CSP, etc.

---

## 📝 Updated Project Structure

```
story-point-poker/
├── package.json          # Root config with build/start scripts
├── render.yaml           # Render deployment config
├── client/
│   ├── dist/            # Built files (created by yarn build)
│   ├── src/
│   └── package.json     # Client dependencies
└── server/
    ├── server.js        # Entry point
    └── package.json     # Server dependencies (ws, axios)
```

---

## 🎯 Key Points

1. **Build Command** (`yarn build`):
   - Installs client dependencies
   - Builds Vue app with Vite
   - Installs server dependencies
   - Creates `client/dist/`

2. **Start Command** (`yarn start`):
   - Runs from project root
   - Executes `node server/server.js`
   - Server serves static files from `../client/dist`
   - Listens on `process.env.PORT` (provided by Render)

3. **Dependencies:**
   - Server needs: `ws`, `axios`
   - Client needs: `vue`, `vite`, `@vitejs/plugin-vue`
   - All installed during build phase

---

## 🆘 Still Having Issues?

1. **Check GitHub commit:**
   ```bash
   git log --oneline -3
   ```
   Should show: "Fix Render deployment configuration"

2. **Re-trigger deploy:**
   - Render Dashboard → Your Service
   - Click "Manual Deploy" → "Clear build cache & deploy"

3. **Check Render status:**
   - https://status.render.com
   - Ensure no ongoing incidents

4. **Contact support:**
   - Render support: https://render.com/docs/support
   - Include: service name, error logs, and "ERR_MODULE_NOT_FOUND" context

---

## 📊 Expected Build Output

```
==> Downloading dependencies
yarn install v1.22.22
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
success Saved lockfile.

==> Running build command 'yarn build'
$ cd client && yarn install && yarn build && cd ../server && yarn install
[1/4] Resolving packages...
success Already up-to-date.
$ vite build
vite v5.4.21 building for production...
transforming...
✓ 26 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  0.42 kB │ gzip:  0.29 kB
dist/assets/index-XXXXX.css     22.97 kB │ gzip:  4.08 kB
dist/assets/index-XXXXX.js      88.44 kB │ gzip: 33.13 kB
✓ built in XXXms
[1/4] Resolving packages...
success Already up-to-date.
Done in XXs.

==> Build successful! 🎉

==> Deploying...
Server is running on port 10000
Environment: production
Access the app at: http://localhost:10000
Server started fresh - no users in memory

==> Your service is live at https://story-point-poker-XXXX.onrender.com
```

---

## 🎉 Success Indicators

✅ Build completes in 2-5 minutes  
✅ "Build successful!" message  
✅ "Server is running" in logs  
✅ Service status: "Live" (green dot)  
✅ URL accessible  
✅ Login page loads  
✅ WebSocket connects  

---

**Your deployment should now work! The configuration has been tested and verified.** 🚀

If you see the error again, check that you've pulled the latest changes:
```bash
git pull origin main
```

Then Render will auto-deploy the fixes on the next push!
