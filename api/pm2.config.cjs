module.exports = {
  apps: [
    {
      name: "genoun-api",
      script: "src/server.js", // or your main entry file
      cwd: "/home/genoun/api",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001, // API port
      },
    },
  ],
};
