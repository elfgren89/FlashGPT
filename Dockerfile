# ----------------------------
# Base Stage
# ----------------------------
    FROM node:18-alpine AS base
    WORKDIR /app
    
    # ----------------------------
    # Backend Build Stage
    # ----------------------------
    FROM base AS backend-build
    WORKDIR /app/backend
    
    # Install dependencies
    COPY backend/package*.json ./
    RUN npm ci --only=production
    
    # Copy backend source
    COPY backend/ ./
    
    # ----------------------------
    # Frontend Build Stage
    # ----------------------------
    FROM base AS frontend-build
    WORKDIR /app/frontend
    
    # Install dependencies
    COPY frontend/package*.json ./
    RUN npm ci
    
    # Build frontend
    COPY frontend/ ./
    RUN npm run build
    
    # ----------------------------
    # Backend Production Stage
    # ----------------------------
    FROM base AS backend-production
    WORKDIR /app/backend
    
    # Copy built backend
    COPY --from=backend-build /app/backend ./
    
    # Environment variables
    ENV NODE_ENV=production
    ARG FRONTEND_URL
    ENV FRONTEND_URL=$FRONTEND_URL
    
    # Expose and run
    EXPOSE 5000
    CMD ["node", "server.js"]
    
    # ----------------------------
    # Frontend Production Stage
    # ----------------------------
    FROM base AS frontend-production
    WORKDIR /app/frontend
    
    # Copy built frontend
    COPY --from=frontend-build /app/frontend/build ./build
    
    # Install serve and configure
    RUN npm install -g serve
    ENV REACT_APP_API_BASE_URL=${BACKEND_URL}/api
    
    # Expose and run
    EXPOSE 3000
    CMD ["serve", "-s", "build", "-l", "3000"]