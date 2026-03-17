#!/bin/bash

# Guardian Bot Startup and Installation Script
# This script installs dependencies and starts the Guardian Discord bot

echo "🤖 Guardian Bot Setup & Start"
echo "============================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your bot token and other configuration."
    exit 1
fi

# Always install/update dependencies
echo "📦 Installing/updating dependencies..."
bun install

# Set environment variables
export NODE_ENV=production

# Start the bot
echo "🚀 Launching Guardian Bot..."
bun run start

# Check if bot started successfully
if [ $? -eq 0 ]; then
    echo "✅ Guardian Bot started successfully!"
else
    echo "❌ Failed to start Guardian Bot"
    exit 1
fi
