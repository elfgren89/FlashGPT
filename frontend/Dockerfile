# -----------------------------------
# frontend/Dockerfile
# -----------------------------------

# Steg 1: Bygg React-appen
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Steg 2: Servera statiska filer via en minimal server
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve

# Kopiera över byggresultatet
COPY --from=build /app/build ./build

# Exponera port 3000
EXPOSE 3000

# Starta servern som serverar statiska filer
CMD ["serve", "-s", "build", "-l", "3000"]
