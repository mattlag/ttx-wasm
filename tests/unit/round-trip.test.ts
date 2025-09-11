import * as fs from 'fs';
import * as path from 'path';

describe('Round-trip conversion test', () => {
  const scratchDir = path.join(__dirname, '..', '_scratch');
  const sampleFontsDir = path.join(__dirname, '..', 'sample fonts');
  const defaultFontFile = 'oblegg.otf';

  // Ensure scratch directory exists
  beforeAll(() => {
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
  });

  test('Font round-trip conversion maintains consistency', async () => {
    // Skip test in Node.js environment since TTX requires Pyodide
    if (typeof window === 'undefined') {
      console.log('Skipping round-trip test in Node.js environment - requires browser/Pyodide');
      return;
    }

    const fontPath = path.join(sampleFontsDir, defaultFontFile);

    // Verify source font exists
    expect(fs.existsSync(fontPath)).toBe(true);

    // Read the original font file
    const originalFontBuffer = fs.readFileSync(fontPath);
    const originalFontData = new Uint8Array(originalFontBuffer);

    // Import TTX module (assumes global TTX is available in browser environment)
    const TTX = (globalThis as any).TTX || (window as any).TTX;

    if (!TTX) {
      throw new Error('TTX module not available - test must run in browser environment');
    }

    await TTX.initialize();

    console.log(`Starting round-trip test with ${defaultFontFile}...`);

    // Step 1: Convert font to TTX (oblegg-1.otf.ttx)
    console.log('Step 1: Converting font to TTX...');
    const ttxContent1 = await TTX.dumpToTTX(originalFontData, {
      tables: [],
      disassembleInstructions: true,
    });

    const ttxFile1 = path.join(scratchDir, 'oblegg-1.otf.ttx');
    fs.writeFileSync(ttxFile1, ttxContent1, 'utf-8');
    console.log(
      `✓ Generated ${path.basename(ttxFile1)} (${Math.round(ttxContent1.length / 1024)} KB)`
    );

    // Step 2: Convert TTX back to font (oblegg-2.otf)
    console.log('Step 2: Converting TTX back to font...');
    const fontData2 = await TTX.compileFromTTX(ttxContent1);

    const fontFile2 = path.join(scratchDir, 'oblegg-2.otf');
    fs.writeFileSync(fontFile2, Buffer.from(fontData2));
    console.log(
      `✓ Generated ${path.basename(fontFile2)} (${Math.round(fontData2.byteLength / 1024)} KB)`
    );

    // Step 3: Convert the regenerated font back to TTX (oblegg-3.otf.ttx)
    console.log('Step 3: Converting regenerated font to TTX...');
    const ttxContent3 = await TTX.dumpToTTX(new Uint8Array(fontData2), {
      tables: [],
      disassembleInstructions: true,
    });

    const ttxFile3 = path.join(scratchDir, 'oblegg-3.otf.ttx');
    fs.writeFileSync(ttxFile3, ttxContent3, 'utf-8');
    console.log(
      `✓ Generated ${path.basename(ttxFile3)} (${Math.round(ttxContent3.length / 1024)} KB)`
    );

    // Step 4: Compare TTX files and calculate similarity
    console.log('Step 4: Comparing TTX files...');
    const { similarity, differences } = compareTTXFiles(ttxContent1, ttxContent3);

    console.log(`\n=== ROUND-TRIP TEST RESULTS ===`);
    console.log(`Similarity: ${similarity.toFixed(2)}%`);

    if (differences.length > 0) {
      console.log(`\nFirst 10 differences:`);
      differences.slice(0, 10).forEach((diff, index) => {
        console.log(`${index + 1}. Line ${diff.lineNumber}:`);
        console.log(`   Original: ${diff.original}`);
        console.log(`   Modified: ${diff.modified}`);
      });
    } else {
      console.log('✓ TTX files are identical!');
    }

    // Test assertions
    expect(similarity).toBeGreaterThan(95); // Expect at least 95% similarity
    expect(ttxContent1.length).toBeGreaterThan(1000); // Sanity check for TTX content
    expect(ttxContent3.length).toBeGreaterThan(1000); // Sanity check for TTX content
    expect(fontData2.byteLength).toBeGreaterThan(1000); // Sanity check for font data

    console.log('\n✓ Round-trip test completed successfully');
  }, 60000); // 60 second timeout for the full round-trip
});

interface Difference {
  lineNumber: number;
  original: string;
  modified: string;
}

interface ComparisonResult {
  similarity: number;
  differences: Difference[];
}

function compareTTXFiles(content1: string, content3: string): ComparisonResult {
  const lines1 = content1.split('\n').map(line => line.trim());
  const lines3 = content3.split('\n').map(line => line.trim());

  const maxLines = Math.max(lines1.length, lines3.length);
  const differences: Difference[] = [];
  let matchingLines = 0;

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i] || '';
    const line3 = lines3[i] || '';

    // Skip lines that contain timestamps or other dynamic content
    const isDynamicLine = (line: string) => {
      return (
        line.includes('created=') ||
        line.includes('modified=') ||
        line.includes('checkSumAdjustment=') ||
        line.includes('<!--') ||
        line.startsWith('<?xml')
      );
    };

    if (isDynamicLine(line1) || isDynamicLine(line3)) {
      matchingLines++; // Consider dynamic lines as matching
      continue;
    }

    if (line1 === line3) {
      matchingLines++;
    } else {
      differences.push({
        lineNumber: i + 1,
        original: line1,
        modified: line3,
      });
    }
  }

  const similarity = maxLines > 0 ? (matchingLines / maxLines) * 100 : 0;

  return { similarity, differences };
}
