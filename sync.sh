#!/bin/bash
# BUG-003 FIX: Bidirectional sync
echo "🔄 Syncing ORBIT source files..."

mkdir -p orbit-extension/icons

# Sync manifest and icons from root to extension
cp manifest.json orbit-extension/

# Sync content.js from extension back to root (source of truth is orbit-extension/)
cp orbit-extension/content.js content.js

# Sync icons
cp -r icons/* orbit-extension/icons/

echo "🚀 ORBIT Synced (Bidirectional) and Folders Verified!"
