import TTX from './dist/ttx-wasm-node.esm.js';
import { readFileSync, writeFileSync } from 'fs';

async function analyzeMtextra() {
  console.log('🔍 Loading mtextra.ttf...');
  const fontData = readFileSync('./tests/sample fonts/mtextra.ttf');

  console.log('📝 Converting to TTX...');
  const originalTTX = await TTX.dumpToTTX(fontData, { disassembleInstructions: true });

  console.log('🔄 Converting back to font...');
  const regeneratedFont = await TTX.compileFromTTX(originalTTX, { 
    recalcBBoxes: false, 
    recalcTimestamp: false 
  });

  console.log('📝 Converting regenerated font to TTX...');
  const roundTripTTX = await TTX.dumpToTTX(new Uint8Array(regeneratedFont), { 
    disassembleInstructions: true 
  });

  // Extract key values
  const extractValue = (ttx, tag) => {
    const regex = new RegExp(`<${tag}[^>]*value="([^"]*)"`, 'i');
    const match = ttx.match(regex);
    return match ? match[1] : null;
  };

  console.log('\n📊 Analysis Results:');
  console.log('====================');
  console.log('Original TTX size:', originalTTX.length, 'chars');
  console.log('Round-trip TTX size:', roundTripTTX.length, 'chars');
  console.log('Size difference:', originalTTX.length - roundTripTTX.length, 'chars');
  
  console.log('\n🔍 Key Value Changes:');
  const origIndexToLoc = extractValue(originalTTX, 'indexToLocFormat');
  const rtIndexToLoc = extractValue(roundTripTTX, 'indexToLocFormat');
  console.log('indexToLocFormat:', origIndexToLoc, '->', rtIndexToLoc);
  
  const origNumHMetrics = extractValue(originalTTX, 'numberOfHMetrics');
  const rtNumHMetrics = extractValue(roundTripTTX, 'numberOfHMetrics');
  console.log('numberOfHMetrics:', origNumHMetrics, '->', rtNumHMetrics);

  // Save files for manual inspection
  writeFileSync('mtextra-original.ttx', originalTTX);
  writeFileSync('mtextra-roundtrip.ttx', roundTripTTX);
  console.log('\n💾 Saved TTX files:');
  console.log('  - mtextra-original.ttx');
  console.log('  - mtextra-roundtrip.ttx');
  
  // Analyze specific sections
  const getSection = (ttx, sectionName) => {
    const startPattern = `<${sectionName}`;
    const endPattern = `</${sectionName}>`;
    const startIndex = ttx.indexOf(startPattern);
    const endIndex = ttx.indexOf(endPattern, startIndex);
    if (startIndex >= 0 && endIndex >= 0) {
      return ttx.substring(startIndex, endIndex + endPattern.length);
    }
    return null;
  };
  
  const origPost = getSection(originalTTX, 'post');
  const rtPost = getSection(roundTripTTX, 'post');
  
  console.log('\n📝 Post Section Analysis:');
  console.log('Original post section length:', origPost ? origPost.length : 'N/A');
  console.log('Round-trip post section length:', rtPost ? rtPost.length : 'N/A');
  
  if (origPost && rtPost) {
    console.log('Post section size difference:', origPost.length - rtPost.length, 'chars');
  }
}

analyzeMtextra().catch(console.error);