#!/usr/bin/env node

/**
 * Render Keep-Alive Script
 * 
 * This script pings the ConceptAI backend every 12 minutes to prevent
 * Render free tier from spinning down due to inactivity.
 * 
 * Usage:
 *   node keep-alive.js
 * 
 * Or as a background process:
 *   nohup node keep-alive.js > keep-alive.log 2>&1 &
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  BACKEND_URL: 'https://concept-ai-backend.onrender.com/health',
  PING_INTERVAL: 12 * 60 * 1000, // 12 minutes in milliseconds
  TIMEOUT: 30000, // 30 seconds timeout
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000 // 5 seconds between retries
};

/**
 * Make HTTP request with timeout and retry logic
 */
function makeRequest(url, timeout = CONFIG.TIMEOUT) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'ConceptAI-KeepAlive/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    const startTime = Date.now();
    req.end();
  });
}

/**
 * Ping backend with retry logic
 */
async function pingBackend() {
  const timestamp = new Date().toISOString();
  console.log(`🏓 [${timestamp}] Pinging backend...`);

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await makeRequest(CONFIG.BACKEND_URL);
      
      console.log(`📊 Status: ${response.statusCode} | Response Time: ${response.responseTime}ms`);
      
      if (response.statusCode === 200) {
        try {
          const health = JSON.parse(response.body);
          if (health.status === 'healthy') {
            console.log(`✅ Backend is healthy! Server timestamp: ${health.timestamp}`);
          } else {
            console.log(`⚠️  Backend responded but status is: ${health.status}`);
          }
        } catch (parseError) {
          console.log(`✅ Backend responded with 200 (JSON parse error: ${parseError.message})`);
        }
        return true;
      } else if (response.statusCode === 503) {
        console.log(`🔄 Backend is spinning up (503) - attempt ${attempt}/${CONFIG.MAX_RETRIES}`);
        if (attempt < CONFIG.MAX_RETRIES) {
          console.log(`⏳ Waiting ${CONFIG.RETRY_DELAY / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
          continue;
        }
      } else {
        console.log(`⚠️  Unexpected status code: ${response.statusCode}`);
        console.log(`Response: ${response.body.substring(0, 200)}...`);
      }
      
      return false;
    } catch (error) {
      console.log(`❌ Attempt ${attempt}/${CONFIG.MAX_RETRIES} failed: ${error.message}`);
      
      if (attempt < CONFIG.MAX_RETRIES) {
        console.log(`⏳ Waiting ${CONFIG.RETRY_DELAY / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      }
    }
  }
  
  console.log(`💥 All ${CONFIG.MAX_RETRIES} attempts failed`);
  return false;
}

/**
 * Main keep-alive loop
 */
async function startKeepAlive() {
  console.log('🚀 Starting ConceptAI Keep-Alive Service');
  console.log(`📡 Target: ${CONFIG.BACKEND_URL}`);
  console.log(`⏰ Interval: ${CONFIG.PING_INTERVAL / 60000} minutes`);
  console.log(`🔄 Max retries: ${CONFIG.MAX_RETRIES}`);
  console.log('='.repeat(50));

  // Initial ping
  await pingBackend();

  // Set up interval for subsequent pings
  setInterval(async () => {
    try {
      await pingBackend();
    } catch (error) {
      console.error(`💥 Unexpected error in keep-alive loop: ${error.message}`);
    }
  }, CONFIG.PING_INTERVAL);

  console.log(`🔄 Keep-alive service is running. Next ping in ${CONFIG.PING_INTERVAL / 60000} minutes.`);
}

/**
 * Graceful shutdown handling
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Start the service
if (require.main === module) {
  startKeepAlive().catch(error => {
    console.error('💥 Failed to start keep-alive service:', error);
    process.exit(1);
  });
}

module.exports = { pingBackend, startKeepAlive };
