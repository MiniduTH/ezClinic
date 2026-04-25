#!/bin/sh
# Read the Cloudflare tunnel URL written by the tunnel service and override
# PAYHERE_NOTIFY_URL before the JVM starts so Spring Boot picks it up.

URL_FILE=/shared/payhere_notify_url
if [ -f "$URL_FILE" ] && [ -s "$URL_FILE" ]; then
    PAYHERE_NOTIFY_URL=$(cat "$URL_FILE")
    export PAYHERE_NOTIFY_URL
    echo "[appointment] PAYHERE_NOTIFY_URL=$PAYHERE_NOTIFY_URL"
fi

exec java -jar app.jar
