#!/bin/bash

# Source Emscripten environment if emcc is not found
if ! command -v emcc &> /dev/null; then
    if [ -f "$HOME/emsdk/emsdk_env.sh" ]; then
        source "$HOME/emsdk/emsdk_env.sh"
    elif [ -f "/opt/emsdk/emsdk_env.sh" ]; then
        source "/opt/emsdk/emsdk_env.sh"
    fi
fi

# Create output directory
mkdir -p public/wasm

# Compile C++ to Wasm
echo "Compiling C++ CAD Engine..."

emcc src/cpp/Engine.cpp src/cpp/wasm/bindings.cpp \
    -o public/wasm/cad_engine.js \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createCADEngine" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s "EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap']" \
    --bind \
    -O3 \
    -std=c++17 \
    -I src/cpp

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "Output: public/wasm/cad_engine.js"
    echo "Output: public/wasm/cad_engine.wasm"
else
    echo "❌ Compilation failed!"
    exit 1
fi
