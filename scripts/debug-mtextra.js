#!/usr/bin/env node
/**
 * Debug script for analyzing mtextra.ttf round-trip issues
 */

import { createServer } from 'http';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';
import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

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

async function analyzeMtextraFont(port) {
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

    // Navigate to a simple page where we can run TTX directly
    await page.goto(`http://localhost:${port}/tests/round-trip-test.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Inject the font name to test
    await page.evaluate(() => {
      window.loadFontOverride = async function() {
        const response = await fetch('../tests/sample fonts/mtextra.ttf');
        return new Uint8Array(await response.arrayBuffer());
      };
    });

    // Wait for TTX to be available and run the analysis
    await page.waitForSelector('#runTest', { timeout: 10000 });

    console.log('🔍 Analyzing mtextra.ttf round-trip conversion...');

    const analysis = await page.evaluate(async () => {
      // Wait for TTX to be available
      while (!window.TTX) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Initialize TTX
      await window.TTX.initialize();
      
      // Load mtextra.ttf
      const fontData = await window.loadFontOverride();
      
      console.log('Step 1: Converting mtextra.ttf to TTX...');
      
      // Convert to TTX with current settings
      const originalTTX = await window.TTX.dumpToTTX(fontData, {
        tables: [],
        disassembleInstructions: true,
      });
      
      console.log('Step 2: Converting TTX back to font...');
      
      // Convert back to font
      const regeneratedFont = await window.TTX.compileFromTTX(originalTTX, {
        recalcBBoxes: false,
        recalcTimestamp: false
      });
      
      console.log('Step 3: Converting regenerated font back to TTX...');
      
      // Convert regenerated font back to TTX
      const roundTripTTX = await window.TTX.dumpToTTX(new Uint8Array(regeneratedFont), {
        tables: [],
        disassembleInstructions: true,
      });
      
      // Extract specific sections for analysis
      const extractSection = (ttx, sectionName) => {
        const lines = ttx.split('\n');
        const start = lines.findIndex(line => line.includes(`<${sectionName}`));
        const end = lines.findIndex((line, i) => i > start && line.includes(`</${sectionName}>`));
        return start >= 0 && end >= 0 ? lines.slice(start, end + 1) : [];
      };
      
      const extractValue = (ttx, tag) => {
        const match = ttx.match(new RegExp(`<${tag}[^>]*value="([^"]*)"`, 'i'));
        return match ? match[1] : null;
      };
      
      // Analyze key sections
      const analysis = {
        originalSize: originalTTX.length,
        roundTripSize: roundTripTTX.length,
        originalIndexToLocFormat: extractValue(originalTTX, 'indexToLocFormat'),
        roundTripIndexToLocFormat: extractValue(roundTripTTX, 'indexToLocFormat'),
        originalNumberOfHMetrics: extractValue(originalTTX, 'numberOfHMetrics'),
        roundTripNumberOfHMetrics: extractValue(roundTripTTX, 'numberOfHMetrics'),
        originalHead: extractSection(originalTTX, 'head'),
        roundTripHead: extractSection(roundTripTTX, 'head'),
        originalHhea: extractSection(originalTTX, 'hhea'),
        roundTripHhea: extractSection(roundTripTTX, 'hhea'),
        originalPost: extractSection(originalTTX, 'post'),
        roundTripPost: extractSection(roundTripTTX, 'post'),
      };
      
      return {
        originalSize: originalTTX.length,
        roundTripSize: roundTripTTX.length,
        originalIndexToLocFormat: extractValue(originalTTX, 'indexToLocFormat'),
        roundTripIndexToLocFormat: extractValue(roundTripTTX, 'indexToLocFormat'),
        originalNumberOfHMetrics: extractValue(originalTTX, 'numberOfHMetrics'),
        roundTripNumberOfHMetrics: extractValue(roundTripTTX, 'numberOfHMetrics'),
        originalHead: extractSection(originalTTX, 'head'),
        roundTripHead: extractSection(roundTripTTX, 'head'),
        originalHhea: extractSection(originalTTX, 'hhea'),
        roundTripHhea: extractSection(roundTripTTX, 'hhea'),
        originalPost: extractSection(originalTTX, 'post'),
        roundTripPost: extractSection(roundTripTTX, 'post'),
        originalTTX: originalTTX,
        roundTripTTX: roundTripTTX
      };
    });

    console.log('\n📊 Analysis Results:');
    console.log('====================');
    console.log(`Original TTX size: ${analysis.originalSize} chars`);
    console.log(`Round-trip TTX size: ${analysis.roundTripSize} chars`);
    console.log(`Size difference: ${analysis.originalSize - analysis.roundTripSize} chars`);
    
    console.log('\n🔍 Key Value Changes:');
    console.log(`indexToLocFormat: ${analysis.originalIndexToLocFormat} → ${analysis.roundTripIndexToLocFormat}`);
    console.log(`numberOfHMetrics: ${analysis.originalNumberOfHMetrics} → ${analysis.roundTripNumberOfHMetrics}`);
    
    console.log('\n📝 Head section differences:');
    console.log('Original head lines:', analysis.originalHead.length);
    console.log('Round-trip head lines:', analysis.roundTripHead.length);
    
    console.log('\n📝 Hhea section differences:');
    console.log('Original hhea lines:', analysis.originalHhea.length);
    console.log('Round-trip hhea lines:', analysis.roundTripHhea.length);
    
    console.log('\n📝 Post section differences:');
    console.log('Original post lines:', analysis.originalPost.length);
    console.log('Round-trip post lines:', analysis.roundTripPost.length);
    
    if (analysis.originalPost.length > 0 && analysis.roundTripPost.length > 0) {
      console.log('\nFirst few original post lines:');
      analysis.originalPost.slice(0, 5).forEach((line, i) => {
        console.log(`  ${i + 1}: ${line.trim()}`);
      });
      
      console.log('\nFirst few round-trip post lines:');
      analysis.roundTripPost.slice(0, 5).forEach((line, i) => {
        console.log(`  ${i + 1}: ${line.trim()}`);
      });
    }

    // Save detailed analysis to files for further inspection
    writeFileSync(join(projectRoot, 'mtextra-original.ttx'), analysis.originalTTX || '');
    writeFileSync(join(projectRoot, 'mtextra-roundtrip.ttx'), analysis.roundTripTTX || '');
    console.log('\n💾 Saved full TTX files for detailed comparison:');
    console.log('  - mtextra-original.ttx');
    console.log('  - mtextra-roundtrip.ttx');

  } finally {
    await browser.close();
  }
}

async function main() {
  let server;

  try {
    const serverInfo = await startLocalServer();
    server = serverInfo.server;

    await analyzeMtextraFont(serverInfo.port);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});