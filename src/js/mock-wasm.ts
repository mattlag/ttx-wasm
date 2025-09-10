// Mock WASM module for development and testing
// This simulates the interface that the real WASM module will provide

export function createMockWasmModule() {
  return {
    // Mock the ccall function that Emscripten provides
    ccall: (functionName: string, returnType: string, argTypes: string[], args: any[]) => {
      console.log(`Mock WASM call: ${functionName}(${args.join(', ')})`);

      switch (functionName) {
        case 'ttx_detect_format':
          return mockDetectFormat(args[0], args[1]);
        case 'ttx_get_font_info':
          return mockGetFontInfo(args[0], args[1]);
        case 'ttx_dump_to_ttx':
          return mockDumpToTTX(args[0], args[1], args[2]);
        case 'ttx_compile_from_ttx':
          return mockCompileFromTTX(args[0], args[1]);
        case 'ttx_list_tables':
          return mockListTables(args[0], args[1]);
        default:
          console.warn(`Unknown WASM function: ${functionName}`);
          return 0;
      }
    },

    // Mock cwrap function
    cwrap: (functionName: string, returnType: string, argTypes: string[]) => {
      return (...args: any[]) => {
        return createMockWasmModule().ccall(functionName, returnType, argTypes, args);
      };
    },

    // Mock memory management
    _malloc: (size: number) => {
      console.log(`Mock malloc: ${size} bytes`);
      return 1000; // Mock pointer
    },

    _free: (ptr: number) => {
      console.log(`Mock free: ${ptr}`);
    },

    // Mock string functions
    UTF8ToString: (ptr: number) => {
      return 'mock-string-result';
    },

    stringToUTF8: (str: string, buffer: number, maxBytesToWrite: number) => {
      console.log(`Mock stringToUTF8: ${str}`);
    },

    HEAPU8: new Uint8Array(1024), // Mock memory heap
  };
}

// Mock implementations of the font processing functions
function mockDetectFormat(dataPtr: number, size: number): number {
  // Return format codes: 1=TTF, 2=OTF, 3=WOFF, 4=WOFF2, 5=TTC
  return 1; // Mock TTF format
}

function mockGetFontInfo(dataPtr: number, size: number): number {
  // Return pointer to font info structure
  return 2000; // Mock pointer
}

function mockDumpToTTX(dataPtr: number, size: number, optionsPtr: number): number {
  // Return pointer to TTX string
  return 3000; // Mock pointer
}

function mockCompileFromTTX(ttxPtr: number, optionsPtr: number): number {
  // Return pointer to binary font data
  return 4000; // Mock pointer
}

function mockListTables(dataPtr: number, size: number): number {
  // Return pointer to table list
  return 5000; // Mock pointer
}
