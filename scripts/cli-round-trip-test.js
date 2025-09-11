#!/usr/bin/env node
/**
 * Command-line round-trip test using headless browser
 * This script runs the browser-based TTX-WASM round-trip test from the command line
 */

import { createServer } from 'http';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const SERVER_PORT = 0; // Use random available port
const TIMEOUT = 120000; // 2 minutes timeout

async function startLocalServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      return handler(request, response, {
        public: projectRoot,
        headers: [
          {
            source: '**',
            headers: [
              {
                key: 'Access-Control-Allow-Origin',
                value: '*',
              },
              {
                key: 'Cross-Origin-Embedder-Policy',
                value: 'require-corp',
              },
              {
                key: 'Cross-Origin-Opener-Policy',
                value: 'same-origin',
              },
            ],
          },
        ],
      });
    });

    server.listen(SERVER_PORT, () => {
      const port = server.address().port;
      console.log(`🌐 Local server started on port ${port}`);
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

async function runRoundTripTest(port) {
  console.log('🚀 Starting headless browser...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor',
    ],
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        console.error(`❌ Browser Error: ${text}`);
      } else if (type === 'warning') {
        console.warn(`⚠️  Browser Warning: ${text}`);
      } else if (text.includes('✓') || text.includes('❌') || text.includes('🔄')) {
        console.log(`📋 ${text}`);
      }
    });

    // Handle page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    console.log('📄 Loading round-trip test page...');

    // Create a custom HTML page that runs the round-trip test
    const testPageContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CLI Round-Trip Test</title>
</head>
<body>
    <h1>CLI Round-Trip Test</h1>
    <div id="status">Initializing...</div>
    <div id="results"></div>
    
    <script type="module">
        import TTX from './dist/ttx-wasm.esm.js';
        
        async function loadFont() {
            const response = await fetch('./tests/sample fonts/oblegg.otf');
            return new Uint8Array(await response.arrayBuffer());
        }
        
        async function runTest() {
            const statusEl = document.getElementById('status');
            const resultsEl = document.getElementById('results');
            
            try {
                statusEl.textContent = 'Initializing TTX-WASM...';
                console.log('🔄 Initializing TTX-WASM...');
                
                // Override the pyodide index URL to use the correct path
                window.PYODIDE_INDEX_URL = './dist/pyodide/';
                
                await TTX.initialize();
                
                statusEl.textContent = 'Loading font...';
                console.log('🔄 Loading font...');
                const fontData = await loadFont();
                console.log(\`✓ Font loaded: \${fontData.length} bytes\`);
                
                statusEl.textContent = 'Running round-trip test...';
                console.log('🔄 Running round-trip test...');
                
                // Step 1: Font → TTX
                console.log('🔄 Step 1: Converting font to TTX...');
                const ttxContent1 = await TTX.dumpToTTX(fontData, {
                    disassembleInstructions: true,
                });
                console.log(\`✓ Generated TTX content (\${Math.round(ttxContent1.length / 1024)} KB)\`);
                
                // Step 2: TTX → Font (with recalc options)
                console.log('🔄 Step 2: Converting TTX back to font...');
                const fontData2 = await TTX.compileFromTTX(ttxContent1, {
                    recalcBBoxes: false,        // Preserve original bounding boxes
                    recalcTimestamp: false      // Preserve original timestamps
                });
                console.log(\`✓ Generated font data (\${Math.round(fontData2.byteLength / 1024)} KB)\`);
                console.log('ℹ Using recalc=false options to preserve original font metrics');
                
                // Step 3: Font → TTX (round-trip)
                console.log('🔄 Step 3: Converting regenerated font to TTX...');
                const ttxContent2 = await TTX.dumpToTTX(new Uint8Array(fontData2), {
                    disassembleInstructions: true,
                });
                console.log(\`✓ Generated round-trip TTX content (\${Math.round(ttxContent2.length / 1024)} KB)\`);
                
                // Step 4: Compare
                console.log('🔄 Step 4: Comparing TTX files...');
                const comparison = TTX.compareTTXContent(ttxContent1, ttxContent2);
                
                const result = {
                    success: comparison.similarity > 95,
                    similarity: comparison.similarity,
                    differences: comparison.differences,
                    stats: {
                        originalSize: fontData.length,
                        ttx1Size: ttxContent1.length,
                        regeneratedSize: fontData2.byteLength,
                        ttx2Size: ttxContent2.length,
                        differenceCount: comparison.differences.length
                    }
                };
                
                // Log results
                console.log(\`\${result.success ? '✅' : '❌'} Round-trip test \${result.success ? 'PASSED' : 'FAILED'}\`);
                console.log(\`📊 Similarity: \${result.similarity.toFixed(2)}%\`);
                console.log(\`📈 Statistics:\`);
                console.log(\`   Original font: \${result.stats.originalSize} bytes\`);
                console.log(\`   TTX size: \${result.stats.ttx1Size} bytes\`);
                console.log(\`   Regenerated font: \${result.stats.regeneratedSize} bytes\`);
                console.log(\`   Round-trip TTX: \${result.stats.ttx2Size} bytes\`);
                console.log(\`   Differences found: \${result.stats.differenceCount}\`);
                
                if (result.stats.differenceCount > 0 && result.stats.differenceCount <= 10) {
                    console.log(\`🔍 First few differences:\`);
                    result.differences.slice(0, 5).forEach((diff, i) => {
                        console.log(\`   \${i + 1}. Line \${diff.lineNumber}: "\${diff.original}" → "\${diff.modified}"\`);
                    });
                }
                
                // Store result for Puppeteer to access
                window.testResult = result;
                statusEl.textContent = result.success ? 'Test PASSED' : 'Test FAILED';
                
            } catch (error) {
                console.error('❌ Test failed:', error.message);
                window.testResult = {
                    success: false,
                    error: error.message
                };
                statusEl.textContent = 'Test FAILED';
            }
        }
        
        // Run the test
        runTest();
    </script>
</body>
</html>`;

    // Set the page content and navigate to it
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle2' });
    await page.setContent(testPageContent);

    console.log('⏳ Waiting for test to complete...');

    // Wait for test to complete
    await page.waitForFunction(() => window.testResult !== undefined, { timeout: TIMEOUT });

    // Get the test result
    const result = await page.evaluate(() => window.testResult);

    console.log('\n📋 Final Results:');
    console.log('================');

    if (result.success) {
      console.log('🎉 Round-trip test PASSED!');
      process.exit(0);
    } else {
      console.log('❌ Round-trip test FAILED!');
      if (result.error) {
        console.log('Error:', result.error);
      }
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🧪 TTX-WASM CLI Round-Trip Test');
  console.log('================================\n');

  let server;

  try {
    // Start local server
    const serverInfo = await startLocalServer();
    server = serverInfo.server;

    // Run the test
    await runRoundTripTest(serverInfo.port);
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
      console.log('🛑 Server stopped');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
