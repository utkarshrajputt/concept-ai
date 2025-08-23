# ConceptAI Keep-Alive System

This repository includes two solutions to prevent your Render backend from spinning down due to inactivity on the free tier.

## 🎯 Problem

Render's free tier spins down web services after 15 minutes of inactivity, causing a ~1 minute cold start delay for the next request.

## 🔧 Solutions

### Option 1: GitHub Actions (Recommended) ⭐

**File**: `.github/workflows/keep-alive.yml`

**Pros:**

- ✅ Runs automatically in the cloud
- ✅ No local setup required
- ✅ Free for public repositories
- ✅ Reliable and maintenance-free
- ✅ Built-in monitoring and logs

**How it works:**

- Runs every 12 minutes automatically
- Pings your `/health` endpoint
- Includes retry logic and error handling
- Logs all activity for monitoring

**Setup:**

1. Push this repository to GitHub
2. The workflow will start automatically
3. Check the "Actions" tab on GitHub to monitor

### Option 2: Local Node.js Script

**File**: `keep-alive.js`

**Pros:**

- ✅ Run locally on your machine
- ✅ Full control over execution
- ✅ Detailed logging

**Cons:**

- ❌ Requires your machine to be always on
- ❌ Manual setup and monitoring

**Setup:**

```bash
# Run once
node keep-alive.js

# Run in background (Linux/Mac)
nohup node keep-alive.js > keep-alive.log 2>&1 &

# Run in background (Windows)
start /B node keep-alive.js > keep-alive.log 2>&1
```

## 📊 Usage Statistics

- **Ping frequency**: Every 12 minutes
- **Monthly pings**: ~3,600 requests
- **GitHub Actions usage**: ~1,460 job runs/month (well within free limits)
- **Render usage**: Keeps your service within the 750 hours/month free tier

## 🔍 Monitoring

### GitHub Actions

- Go to your repository → Actions tab
- Click on "Keep Render Backend Alive" workflow
- View execution logs and success/failure status

### Local Script

- Check console output or `keep-alive.log` file
- Look for ✅ success indicators or ❌ error messages

## 🛡️ Safety Features

Both solutions include:

- **Timeout protection**: 30-second request timeout
- **Retry logic**: 3 attempts with 5-second delays
- **Error handling**: Graceful failure handling
- **Minimal impact**: Lightweight requests to `/health` endpoint
- **Monitoring**: Detailed logging for troubleshooting

## 🚨 Important Notes

1. **Render Terms**: Check Render's current terms of service regarding keep-alive practices
2. **Free Tier Limits**: Monitor your usage to stay within 750 hours/month
3. **Alternative**: Consider upgrading to a paid plan for guaranteed uptime
4. **Endpoint**: Uses the existing `/health` endpoint (no backend changes needed)

## 🔧 Configuration

To change the ping interval, modify:

- **GitHub Actions**: Update the `cron` schedule in `.github/workflows/keep-alive.yml`
- **Local Script**: Change `PING_INTERVAL` in `keep-alive.js`

## 🆘 Troubleshooting

### Common Issues:

1. **503 errors**: Normal during cold starts, retries handle this
2. **Timeout errors**: Backend might be overloaded, retries will continue
3. **GitHub Actions not running**: Check if the repository is public and actions are enabled

### Debug Steps:

1. Test the health endpoint manually: `curl https://concept-ai-backend.onrender.com/health`
2. Check GitHub Actions logs for detailed error messages
3. Verify your Render service URL is correct

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Your backend responds faster (no cold start delay)
- ✅ GitHub Actions show successful runs every 12 minutes
- ✅ Render dashboard shows consistent activity
- ✅ Users experience faster response times
