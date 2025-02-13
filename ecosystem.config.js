module.exports = {
  apps: [
    {
      name: "backend",
      script: "/app/backend/server.js",
      env: {
        NODE_ENV: "production"
      },
      env_file: "/app/backend/.env"
    }
  ]
};