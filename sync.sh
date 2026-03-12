#!/bin/bash

echo "🔄 Syncing ORBIT source files to orbit-extension/ ..."

mkdir -p orbit-extension/icons

cp manifest.json orbit-extension/
cp content.js orbit-extension/
cp -r icons/* orbit-extension/icons/

echo "🚀 ORBIT Synced and Folders Verified!"
