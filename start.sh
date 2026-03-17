#!/bin/bash

echo "🤖 Guardian Bot Setup & Start"
echo "============================="

if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your bot token and other configuration."
    exit 1
fi

echo "📦 Installing/updating dependencies..."
bun install

export NODE_ENV=production

echo "🚀 Launching Guardian Bot..."
bun run start

if [ $? -eq 0 ]; then
    echo "✅ Guardian Bot started successfully!"
else
    echo "❌ Failed to start Guardian Bot"
    exit 1
fi
