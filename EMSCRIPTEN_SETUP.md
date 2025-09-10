# Emscripten Installation Guide for Windows

## Prerequisites

- Git
- Python 3.6 or later
- CMake (optional but recommended)

## Installation Steps

1. **Clone the Emscripten SDK:**

   ```powershell
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ```

2. **Install and activate the latest version:**

   ```powershell
   # Install the latest version
   .\emsdk install latest

   # Activate the latest version
   .\emsdk activate latest

   # Set up the environment for this session
   .\emsdk_env.bat
   ```

3. **Verify installation:**

   ```powershell
   em++ --version
   emcc --version
   ```

4. **Add to PATH permanently (optional):**
   - Add the emsdk directory to your system PATH
   - Add the environment variables that emsdk_env.bat sets

## Building TTX-WASM

Once Emscripten is installed and activated:

```powershell
# Navigate to the ttx-wasm project
cd path\to\ttx-wasm

# Build the WASM module
npm run build:wasm

# Or build everything
npm run build:full
```

## Troubleshooting

- **"em++ is not recognized"**: Make sure you ran `.\emsdk_env.bat` in the
  current session
- **Python errors**: Ensure Python 3.6+ is installed and in your PATH
- **Permission errors**: Run PowerShell as Administrator if needed
