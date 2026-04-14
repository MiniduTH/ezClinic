@echo off
echo Starting Ngrok on port 3004...
echo Make sure you have downloaded ngrok from https://ngrok.com/download
echo and authenticated using: ngrok config add-authtoken YOUR_TOKEN
ngrok http 3004
pause
