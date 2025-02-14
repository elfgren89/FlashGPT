# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy project files
COPY frontend ./
ARG REACT_APP_API_BASE_URL="http://localhost:5000/api"
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

# Build the React app
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy project files
COPY backend ./

# Set environment variables for backend
ENV PORT=5000
ENV NODE_ENV=production
ENV API_BASE_URL=http://localhost:5000
ENV FRONTEND_URL=http://localhost:3000

# Stage 3: Final container
FROM node:18-alpine
WORKDIR /app

# Install global dependencies
RUN npm install -g serve pm2

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Copy backend
COPY --from=backend-build /app/backend ./backend

# Expose necessary ports
EXPOSE 3000 5000

# Copy PM2 ecosystem config (for process management)
#COPY backend/ecosystem.config.js .

# Start both frontend and backend
CMD sh -c "node backend/server.js & serve -s frontend/build -l 3000"
