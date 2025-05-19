export default {
  apps: [
    {
      name: 'fp-middleware-api',
      script: './index.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};