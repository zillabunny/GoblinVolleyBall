FROM node:22-slim

WORKDIR /app

# Copy real package.json (has "type": "module") and install only ws
COPY package.json ./
RUN npm install ws && rm -rf /root/.npm

# Copy server + client + scripts
COPY server/ ./server/
COPY scripts/ ./scripts/
COPY client/ ./client/

ENV PORT=8080
EXPOSE 8080

CMD ["node", "scripts/serve.js"]
