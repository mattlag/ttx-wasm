#!/usr/bin/env node
/**
 * Simple CLI round-trip test using the existing test page
 * Usage: node simple-cli-test.js [--verbose|--details]
 */

import { createServer } from 'http';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const showDetails = args.includes('--verbose') || args.includes('--details') || args.includes('-v');

// ANSI color codes for styling
const colors = {
  cyan: '\x1b[96m',    // Light cyan
  reset: '\x1b[0m',    // Reset to default
  green: '\x1b[92m',   // Light green
  yellow: '\x1b[93m',  // Light yellow
  red: '\x1b[91m'      // Light red
};

// Colored console output functions
const cyanLog = (message) => console.log(`${colors.cyan}${message}${colors.reset}`);
const greenLog = (message) => console.log(`${colors.green}${message}${colors.reset}`);
const yellowLog = (message) => console.log(`${colors.yellow}${message}${colors.reset}`);
const redLog = (message) => console.log(`${colors.red}${message}${colors.reset}`);

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

    server.listen(0, () => {
      const port = server.address().port;
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

async function runRoundTripTest(port, fontName, showDetails = false) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
    ],
  });

  try {
    const page = await browser.newPage();

    // Suppress all console output from the page
    page.on('console', () => {});
    page.on('pageerror', () => {});
    page.on('requestfailed', () => {});

    // Navigate to the existing test page
    await page.goto(`http://localhost:${port}/tests/round-trip-test.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // If a specific font is requested, we need to modify the test page to use it
    if (fontName !== 'oblegg.otf') {
      // Inject code to change the font file being tested
      await page.evaluate(fontName => {
        // Override the font loading to use the specified font
        window.TEST_FONT_NAME = fontName;
      }, fontName);
    }

    // Wait for the test button and click it
    await page.waitForSelector('#runTest', { timeout: 10000 });
    await page.click('#runTest');

    // Wait for completion
    await page.waitForFunction(
      () => {
        const status = document.querySelector('.status');
        return (
          status &&
          (status.textContent.includes('Round-trip test completed') ||
            status.textContent.includes('Error:'))
        );
      },
      { timeout: 120000 }
    );

    // Get results
    const results = await page.evaluate(showDetails => {
      const status = document.querySelector('.status');
      const statusText = status ? status.textContent : '';
      const logElement = document.getElementById('log');

      let similarity = 0;
      let success = false;
      let differences = [];
      let stats = {};

      // Look for "Round-trip test completed - XX.XX% similarity"
      const completedMatch = statusText.match(/Round-trip test completed - ([\d.]+)% similarity/);
      if (completedMatch) {
        similarity = parseFloat(completedMatch[1]);
        success = similarity > 95; // Consider >95% similarity as success
      }

      // Check for error status
      const hasError = statusText.includes('Error:');
      if (hasError) {
        success = false;
      }

      // Extract detailed information if requested
      if (showDetails && logElement) {
        const logText = logElement.textContent;

        // Extract differences from log
        const diffMatches = logText.match(
          /(\d+)\. Line (\d+):\s*Original: (.+?)\s*Modified: (.+?)(?=\n\d+\.|\n===|$)/gs
        );
        if (diffMatches) {
          differences = diffMatches
            .slice(0, 10)
            .map(match => {
              const parts = match.match(/(\d+)\. Line (\d+):\s*Original: (.+?)\s*Modified: (.+)/s);
              if (parts) {
                return {
                  diffNumber: parseInt(parts[1]),
                  lineNumber: parseInt(parts[2]),
                  original: parts[3].trim(),
                  modified: parts[4].trim(),
                };
              }
              return null;
            })
            .filter(diff => diff !== null);
        }

        // Extract statistics (look for different patterns in log)
        const sizeMatches = logText.match(/Generated \w+ TTX content \((\d+) KB\)/g);
        if (sizeMatches) {
          stats.sizes = sizeMatches
            .map((match, index) => {
              const sizeOnly = match.match(/\((\d+) KB\)/);
              return sizeOnly
                ? {
                    type:
                      index === 0
                        ? 'original TTX'
                        : index === 1
                          ? 'round-trip TTX'
                          : `TTX-${index}`,
                    size: parseInt(sizeOnly[1]),
                  }
                : null;
            })
            .filter(s => s !== null);
        }

        // Extract similarity info from log
        const simLogMatch = logText.match(/Similarity: ([\d.]+)%/);
        if (simLogMatch && !similarity) {
          similarity = parseFloat(simLogMatch[1]);
        }
      }

      return {
        success,
        similarity,
        statusText,
        hasError,
        differences,
        stats,
        logLength: logElement ? logElement.textContent.length : 0,
      };
    }, showDetails);

    // Output results with cyan styling
    if (results.hasError) {
      redLog(`${fontName}: ERROR`);
      if (showDetails) {
        cyanLog(`  Error details: ${results.statusText}`);
      }
      return false;
    } else {
      // Color based on similarity
      if (results.similarity === 100) {
        greenLog(`${fontName}: ${results.similarity}%`);
      } else if (results.similarity >= 95) {
        yellowLog(`${fontName}: ${results.similarity}%`);
      } else {
        redLog(`${fontName}: ${results.similarity}%`);
      }

      if (showDetails) {
        // Show file sizes if available
        if (results.stats.sizes && results.stats.sizes.length > 0) {
          cyanLog(`  File sizes:`);
          results.stats.sizes.forEach(size => {
            cyanLog(`    ${size.type}: ${size.size} KB`);
          });
        }

        // Show differences if any
        if (results.differences && results.differences.length > 0) {
          cyanLog(`  First ${Math.min(results.differences.length, 10)} differences:`);
          results.differences.forEach((diff, index) => {
            cyanLog(`    ${index + 1}. Line ${diff.lineNumber}:`);
            cyanLog(`       Original: ${diff.original}`);
            cyanLog(`       Modified: ${diff.modified}`);
          });
        } else if (results.similarity === 100) {
          greenLog(`  ✓ TTX files are identical!`);
        }
        cyanLog(''); // Add blank line for readability
      }

      return results.success;
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  let server;

  try {
    const serverInfo = await startLocalServer();
    server = serverInfo.server;

    // Test the default font (oblegg.otf)
    const success = await runRoundTripTest(serverInfo.port, 'oblegg.otf', showDetails);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.log('oblegg.otf: ERROR');
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

main().catch(() => {
  console.log('oblegg.otf: ERROR');
  process.exit(1);
});
