@echo off
REM TTX-WASM Build Script for Windows
REM This script builds the C++ source to WebAssembly using Emscripten

REM Check if Emscripten is available
where em++ >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Emscripten (em++) not found in PATH
    echo Please install Emscripten SDK and activate it:
    echo   1. git clone https://github.com/emscripten-core/emsdk.git
    echo   2. cd emsdk
    echo   3. emsdk install latest
    echo   4. emsdk activate latest
    echo   5. emsdk_env.bat
    exit /b 1
)

echo Building TTX-WASM...

REM Create output directory if it doesn't exist
if not exist "..\dist\" mkdir "..\dist\"

REM Set variables
set SRCDIR=..\src\wasm
set SOURCES=%SRCDIR%\ttx_wasm.cpp
set OUTPUT_DIR=..\dist
set WASM_OUTPUT=%OUTPUT_DIR%\ttx-wasm.js

REM Compiler flags
set CXXFLAGS=-std=c++17 -O3 -s WASM=1

REM Include directories
set INCLUDES=-I%SRCDIR%

echo Compiling with Emscripten...

em++ -std=c++17 -O3 -s WASM=1 -I%SRCDIR% -s EXPORT_NAME="TTXWasm" -s MODULARIZE=1 -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=16777216 -s NO_EXIT_RUNTIME=1 -s ENVIRONMENT=web,node -o %WASM_OUTPUT% %SOURCES%

if %errorlevel% equ 0 (
    echo Build successful!
    echo Output files:
    echo   %WASM_OUTPUT%
    echo   %OUTPUT_DIR%\ttx-wasm.wasm
) else (
    echo Build failed!
    exit /b 1
)
