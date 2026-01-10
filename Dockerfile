# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

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

# Start both server and serve static files
CMD ["sh", "-c", "npx serve dist -l 3000 & node server/index.js"]
