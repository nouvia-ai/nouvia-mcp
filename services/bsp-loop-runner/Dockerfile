FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production 2>/dev/null || npm install --production

# Copy source and prompts
COPY src/ ./src/
COPY prompts/ ./prompts/

# Cloud Run sets PORT but this is a job, not a service
# No port needed — the process runs and exits

CMD ["node", "src/index.js"]
