# -----------------------------------
# backend/Dockerfile
# -----------------------------------
    FROM node:18-alpine
    WORKDIR /app
    
    # Kopiera package*.json först och installera beroenden
    COPY package*.json ./
    RUN npm install
    
    # Kopiera övriga backend-filer
    COPY . .
    
    # Exponera port 5000 och starta
    EXPOSE 5000
    CMD ["node", "server.js"]
    