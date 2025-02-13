module.exports = {
  apps: [
    {
      name: "backend",
      script: "/app/backend/server.js",
      env: {
        NODE_ENV: "production"
      },
      env_file: "/app/backend/.env"
    },
    {
      name: "frontend",
      script: "serve",
      args: "-s /app/frontend/build -l 0.0.0.0 -p 3000",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
