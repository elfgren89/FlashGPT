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
      script: "npx",
      args: ["serve", "-s", "/app/frontend/build", "-l", "3000"],
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
