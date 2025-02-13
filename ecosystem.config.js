module.exports = {
  apps: [{
    name: "flashgpt",
    script: "/app/backend/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    env_file: "/app/backend/.env"
  }]
};