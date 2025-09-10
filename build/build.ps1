# TTX-WASM Build Script for Windows PowerShell
# This script builds the C++ source to WebAssembly using Emscripten

# Check if Emscripten is available
if (-not (Get-Command "em++" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Emscripten (em++) not found in PATH" -ForegroundColor Red
    Write-Host "Please install Emscripten SDK and activate it:" -ForegroundColor Yellow
    Write-Host "  1. git clone https://github.com/emscripten-core/emsdk.git"
    Write-Host "  2. cd emsdk"
    Write-Host "  3. .\emsdk install latest"
    Write-Host "  4. .\emsdk activate latest"
    Write-Host "  5. .\emsdk_env.bat"
    exit 1
}

Write-Host "Building TTX-WASM..." -ForegroundColor Green

# Create output directory if it doesn't exist
if (-not (Test-Path "..\dist")) {
    New-Item -ItemType Directory -Path "..\dist" -Force | Out-Null
}

# Set variables
$SRCDIR = "..\src\wasm"
$SOURCES = "$SRCDIR\ttx_wasm.cpp"
$OUTPUT_DIR = "..\dist"
$WASM_OUTPUT = "$OUTPUT_DIR\ttx-wasm.js"

Write-Host "Compiling with Emscripten..." -ForegroundColor Cyan

# Run the compilation
$arguments = @(
    "-std=c++17"
    "-O3"
    "-s", "WASM=1"
    "-I$SRCDIR"
    "-s", "EXPORT_NAME=`"TTXWasm`""
    "-s", "MODULARIZE=1"
    "-s", "EXPORTED_FUNCTIONS=['_ttx_detect_format', '_ttx_get_font_info', '_ttx_dump_to_ttx', '_ttx_compile_from_ttx', '_ttx_list_tables', '_ttx_alloc', '_ttx_free', '_ttx_cleanup_output']"
    "-s", "EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap', 'getValue', 'setValue', 'UTF8ToString', 'stringToUTF8']"
    "-s", "ALLOW_MEMORY_GROWTH=1"
    "-s", "INITIAL_MEMORY=16777216"
    "-s", "NO_EXIT_RUNTIME=1"
    "-s", "ENVIRONMENT=web,node"
    "-o", $WASM_OUTPUT
    $SOURCES
)

& em++ @arguments

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host "Output files:" -ForegroundColor Green
    Write-Host "  $WASM_OUTPUT"
    Write-Host "  $OUTPUT_DIR\ttx-wasm.wasm"
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
