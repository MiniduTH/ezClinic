# Base image
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm ci

# Bundle app source
COPY . .

# Build the app
RUN npm run build

# --- Production image ---
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the built assets from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/main"]
