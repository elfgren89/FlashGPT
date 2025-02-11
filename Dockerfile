# ----------------------------
# Base Stage
# ----------------------------
    FROM node:18-alpine AS base
    WORKDIR /app
    
    # ----------------------------
    # Backend Build Stage
    # ----------------------------
    FROM base AS backend
    WORKDIR /app/backend
    COPY backend/package*.json ./
    RUN npm ci --production
    COPY backend/ ./
    
    # ----------------------------
    # Frontend Build Stage
    # ----------------------------
    FROM base AS frontend
    WORKDIR /app/frontend
    COPY frontend/package*.json ./
    RUN npm ci
    COPY frontend/ ./
    RUN npm run build
    
    # ----------------------------
    # Production Stage
    # ----------------------------
    FROM base AS production
    WORKDIR /app
    
    # Copy backend
    COPY --from=backend /app/backend ./backend
    
    # Copy frontend build
    COPY --from=frontend /app/frontend/build ./public
    
    # Environment variables
    ENV NODE_ENV=production
    ENV PORT=5000
    
    # Expose port
    EXPOSE 5000
    
    # Start command
    CMD ["node", "backend/server.js"]