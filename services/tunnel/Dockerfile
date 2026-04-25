FROM alpine:3.19

RUN apk add --no-cache curl && \
    ARCH=$(uname -m) && \
    [ "$ARCH" = "aarch64" ] && CF_ARCH="arm64" || CF_ARCH="amd64" && \
    curl -fsSLo /usr/local/bin/cloudflared \
        "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" && \
    chmod +x /usr/local/bin/cloudflared

COPY start-tunnel.sh /start-tunnel.sh
RUN chmod +x /start-tunnel.sh

CMD ["/start-tunnel.sh"]
