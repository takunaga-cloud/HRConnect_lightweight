#!/bin/bash
set -e

echo "=== Backend Setup ==="
cd backend
python -m venv venv || true
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt || true

echo "=== Frontend Setup ==="
cd ../frontend
npm install || true

echo "=== Setup Complete ==="
