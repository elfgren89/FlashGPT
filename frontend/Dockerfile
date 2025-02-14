# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Set correct API Base URL for Docker and local use
ARG REACT_APP_API_BASE_URL="http://localhost:5000/api"
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

# Build the React app
RUN npm run build

# Stage 2: Serve frontend
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve

# Copy built frontend from previous stage
COPY --from=frontend-build /app/build ./build

# Expose frontend port
EXPOSE 3000

# Serve the built frontend
CMD ["serve", "-s", "build", "-l", "3000"]
