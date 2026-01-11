# Build stage
FROM node:20 as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies INCLUDING optional ones (needed for Rollup on Alpine)
RUN npm ci && npm install --no-save @rollup/rollup-linux-x64-gnu

# Copy source files
COPY . .

# Set production environment variables for build
ENV NODE_ENV=production
ENV VITE_API_URL=https://web-billing-application.onrender.com

# Build the application
RUN npm run build

# Production stage
FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev
# Install server dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
WORKDIR /app

# Copy server
COPY --from=build /app/server ./server

# Copy built frontend
COPY --from=build /app/dist ./dist

# Create data directory
RUN mkdir -p ./data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start server (serve built files from dist)
CMD ["node", "server/index.js"]