# Stage 1: Build backend
FROM node:18-alpine AS backend-build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Set environment variables for backend
ENV PORT=5000
ENV NODE_ENV=production
ENV API_BASE_URL=http://localhost:5000
ENV FRONTEND_URL=http://localhost:3000

# Expose backend port
EXPOSE 5000

# Start the backend server
CMD ["node", "server.js"]
