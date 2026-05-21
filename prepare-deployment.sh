#!/bin/bash

# Script untuk prepare project sebelum zip
# Jalankan di root project directory

echo "🧹 Cleaning up project..."

# Remove node_modules
echo "Removing node_modules..."
rm -rf node_modules
rm -rf backend/node_modules
rm -rf src/node_modules

# Remove .env files (keep .env.example)
echo "Removing .env files..."
rm -f .env
rm -f backend/.env
rm -f src/.env

# Remove build files
echo "Removing build files..."
rm -rf dist
rm -rf backend/dist

# Remove logs
echo "Removing log files..."
rm -f *.log
rm -f backend/*.log

# Remove OS files
echo "Removing OS files..."
rm -rf .DS_Store
rm -rf backend/.DS_Store
rm -rf src/.DS_Store

# Remove git files (optional)
echo "Removing git files..."
rm -rf .git
rm -rf backend/.git

echo "✅ Cleanup complete!"
echo ""
echo "📦 Ready to zip. Run:"
echo "zip -r lapor-fipp-v2.zip . -x 'node_modules/*' '.env' 'backend/.env' 'src/.env' 'dist/*' '.git/*' '.DS_Store'"
