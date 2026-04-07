#!/bin/bash

# Rep'd Social Media Calendar — Startup Script
# Double-click this file to start the app

cd "$(dirname "$0")"

# Open the server in a new Terminal tab
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PWD/server' && node index.js"
end tell
EOF

# Wait a moment for the server to start
sleep 2

# Open the client in another new Terminal tab
osascript <<EOF
tell application "Terminal"
    activate
    tell application "System Events" to keystroke "t" using command down
    do script "cd '$PWD/client' && npm run dev" in front window
end tell
EOF

# Wait for Vite to start
sleep 3

# Open the app in the browser
open http://localhost:5173
