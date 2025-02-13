// ecosystem.config.js
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
      script: "serve",  // Changed from "npx" to direct "serve" command
      args: [
        "-s", 
        "/app/frontend/build", 
        "-l", 
        "tcp://0.0.0.0:3000"  // This is the crucial binding fix
      ],
      env: {
        NODE_ENV: "production",
        PM2_SERVE_PATH: "/app/frontend/build",
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: "true"
      }
    }
  ]
};