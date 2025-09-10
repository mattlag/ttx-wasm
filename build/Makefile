# TTX-WASM Makefile
# Builds C++ source to WebAssembly using Emscripten

# Emscripten compiler
CXX = em++

# Source files
SRCDIR = ../src/wasm
SOURCES = $(SRCDIR)/ttx_wasm.cpp

# Output files
OUTPUT_DIR = ../dist
WASM_OUTPUT = $(OUTPUT_DIR)/ttx-wasm.js
WASM_MODULE = $(OUTPUT_DIR)/ttx-wasm.wasm

# Compiler flags
CXXFLAGS = -std=c++17 -O3 -s WASM=1
EMCC_FLAGS = \
	-s EXPORT_NAME='"TTXWasm"' \
	-s MODULARIZE=1 \
	-s EXPORTED_FUNCTIONS='["_ttx_detect_format", "_ttx_get_font_info", "_ttx_dump_to_ttx", "_ttx_compile_from_ttx", "_ttx_list_tables", "_ttx_alloc", "_ttx_free", "_ttx_cleanup_output"]' \
	-s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "getValue", "setValue", "UTF8ToString", "stringToUTF8"]' \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s INITIAL_MEMORY=16777216 \
	-s STACK_SIZE=5242880 \
	-s NO_EXIT_RUNTIME=1 \
	-s ENVIRONMENT=web,node

# Include directories
INCLUDES = -I$(SRCDIR)

# Default target
all: $(WASM_OUTPUT)

# Create output directory
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Build WASM module
$(WASM_OUTPUT): $(SOURCES) | $(OUTPUT_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(EMCC_FLAGS) -o $(WASM_OUTPUT) $(SOURCES)

# Development build with debug symbols
debug: CXXFLAGS += -g -s ASSERTIONS=1 -s SAFE_HEAP=1
debug: $(WASM_OUTPUT)

# Optimized release build
release: CXXFLAGS += -Oz -DNDEBUG --closure 1
release: $(WASM_OUTPUT)

# Clean build artifacts
clean:
	rm -f $(OUTPUT_DIR)/ttx-wasm.*

# Test the WASM module (requires Node.js)
test: $(WASM_OUTPUT)
	node -e "const TTX = require('./$(WASM_OUTPUT)'); TTX().then(module => { console.log('WASM module loaded successfully'); console.log('Exported functions:', Object.keys(module)); });"

# Install Emscripten (if not already installed)
install-emscripten:
	@echo "Installing Emscripten..."
	@echo "Please follow the instructions at: https://emscripten.org/docs/getting_started/downloads.html"
	@echo "Or use: git clone https://github.com/emscripten-core/emsdk.git && cd emsdk && ./emsdk install latest && ./emsdk activate latest"

# Check if Emscripten is available
check-emscripten:
	@which em++ > /dev/null || (echo "Emscripten not found. Run 'make install-emscripten' first." && exit 1)
	@echo "Emscripten found: $$(em++ --version | head -1)"

# Help target
help:
	@echo "TTX-WASM Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  all (default)       - Build the WASM module"
	@echo "  debug              - Build with debug symbols and assertions"
	@echo "  release            - Build optimized release version"
	@echo "  clean              - Remove build artifacts"
	@echo "  test               - Test the built WASM module"
	@echo "  check-emscripten   - Check if Emscripten is installed"
	@echo "  install-emscripten - Show instructions for installing Emscripten"
	@echo "  help               - Show this help message"
	@echo ""
	@echo "Requirements:"
	@echo "  - Emscripten SDK installed and activated"
	@echo "  - Node.js (for testing)"

.PHONY: all debug release clean test install-emscripten check-emscripten help
