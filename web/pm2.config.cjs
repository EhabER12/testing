module.exports = {
  apps: [
    {
      name: "genoun-web",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/home/genoun/web",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000, // Web port
      },
    },
  ],
};
