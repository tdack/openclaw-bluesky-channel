FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends gettext-base git openssh-client ca-certificates python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Rewrite SSH git URLs to HTTPS so transitive deps (e.g. baileys/libsignal-node) install without SSH keys
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"

RUN npm install -g openclaw

COPY config/openclaw.json.tmpl /config/openclaw.json.tmpl
COPY config/openclaw.bootstrap.json.tmpl /config/openclaw.bootstrap.json.tmpl
COPY config/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
