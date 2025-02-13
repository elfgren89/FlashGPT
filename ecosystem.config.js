module.exports = {
  apps: [{
    name: "backend",
    script: "/app/backend/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    env_file: "/app/backend/.env"
  }]
};