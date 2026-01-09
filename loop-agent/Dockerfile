FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Command will be overridden by railway or docker-compose
CMD ["node", "--import", "tsx", "src/index.ts"]
