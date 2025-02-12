# ===============================
# Steg 1: Bygg frontend
# ===============================
FROM node:18-alpine AS build
WORKDIR /app

# 1. Installera frontend-beroenden och bygg (React)
COPY frontend/package*.json /app/frontend/
RUN cd /app/frontend && npm install

COPY frontend/ /app/frontend/
RUN cd /app/frontend && npm run build

# ===============================
# Steg 2: Bygg backend & kopiera frontend-build
# ===============================
# Nu använder vi samma Node-bild för att installera backend
FROM node:18-alpine AS production
WORKDIR /app

# 1. Installera backend-beroenden
COPY backend/package*.json /app/backend/
RUN cd /app/backend && npm install

# 2. Kopiera backend-koden
COPY backend/ /app/backend/

# 3. Kopiera in det byggda frontend-resultatet till backend
#    så att servern i backend kan leverera statiska filer
RUN mkdir -p /app/backend/frontend
COPY --from=build /app/frontend/build /app/backend/frontend/build

# 4. Ange arbetsmapp, exponera port & starta servern
WORKDIR /app/backend
EXPOSE 5000
CMD ["node", "server.js"]
