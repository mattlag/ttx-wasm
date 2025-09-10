// Direct test of the WASM module
const path = require('path');

async function testWASM() {
  console.log('Testing direct WASM module loading...');

  try {
    // Load the WASM module directly
    const wasmPath = path.join(__dirname, '../dist/ttx-wasm.js');
    console.log('Loading WASM from:', wasmPath);

    const TTXWasmFactory = require(wasmPath);
    console.log('Factory loaded, type:', typeof TTXWasmFactory);
    console.log('Factory keys:', Object.keys(TTXWasmFactory));

    const wasmFactory = TTXWasmFactory.default || TTXWasmFactory;
    console.log('Using factory:', typeof wasmFactory);

    const wasmModule = await wasmFactory();
    console.log('WASM module loaded!');
    console.log(
      'Available methods:',
      Object.keys(wasmModule).filter(k => typeof wasmModule[k] === 'function')
    );

    // Test a simple function call
    if (wasmModule.ccall) {
      console.log('Testing ccall...');
      // Create a small buffer for testing
      const testData = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x0c]); // TTF header
      const ptr = wasmModule._malloc(testData.length);
      wasmModule.HEAPU8.set(testData, ptr);

      try {
        const format = wasmModule.ccall(
          'ttx_detect_format',
          'number',
          ['number', 'number'],
          [ptr, testData.length]
        );
        console.log('Format detection result:', format);
      } catch (e) {
        console.log('Error calling ttx_detect_format:', e.message);
      }

      wasmModule._free(ptr);
    }
  } catch (error) {
    console.error('Error testing WASM:', error);
  }
}

testWASM();
