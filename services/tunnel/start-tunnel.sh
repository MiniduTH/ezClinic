#!/bin/sh
# Starts a Cloudflare quick tunnel pointing at Kong (port 8000).
# Writes the assigned public URL to /shared/payhere_notify_url so the
# appointment service can read it before the JVM starts.

set -e

# Remove stale URL from a previous run so the healthcheck stays false
# until this run's URL is confirmed.
rm -f /shared/payhere_notify_url

echo "[tunnel] Connecting to Cloudflare — http://kong:8000"
cloudflared tunnel --no-autoupdate --url http://kong:8000 >/tmp/cf.log 2>&1 &
CF_PID=$!

TIMEOUT=90
elapsed=0
while [ "$elapsed" -lt "$TIMEOUT" ]; do
    if grep -qE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf.log 2>/dev/null; then
        break
    fi
    if ! kill -0 "$CF_PID" 2>/dev/null; then
        echo "[tunnel] cloudflared exited unexpectedly:"
        cat /tmp/cf.log
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ "$elapsed" -ge "$TIMEOUT" ]; then
    echo "[tunnel] Timed out waiting for tunnel URL"
    cat /tmp/cf.log
    exit 1
fi

BASE_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf.log | head -1)
printf '%s/api/payments/payhere/notify' "$BASE_URL" > /shared/payhere_notify_url

echo "[tunnel] Public URL : $BASE_URL"
echo "[tunnel] Notify URL : $(cat /shared/payhere_notify_url)"

# Relay ongoing cloudflared output and stay alive with the process
tail -n +1 -f /tmp/cf.log &
wait "$CF_PID"
