#!/bin/bash
# Python Sidecar Setup Script for TSuperMachine (v2 - venv compatible)

set -e

echo "🔧 TSuperMachine Python Sidecar Setup"
echo "======================================"

# Determine Python command
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    if command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo "❌ Python not found. Please install Python 3.8+."
        exit 1
    fi
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
echo "✓ Found Python: $PYTHON_VERSION"

# Navigate to python directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create virtual environment if not exists
if [ ! -d ".venv" ]; then
    echo "🔨 Creating virtual environment (.venv)..."
    $PYTHON_CMD -m venv .venv
    if [ $? -ne 0 ]; then
         echo "❌ Failed to create venv. Please install 'python-venv' package."
         exit 1
    fi
else
    echo "✓ Virtual environment found."
fi

# Activate and install
source .venv/bin/activate

echo "📦 Installing dependencies (CoolProp, NumPy, SciPy, SymPy)..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo "Python environment is ready at: $SCRIPT_DIR/.venv"
