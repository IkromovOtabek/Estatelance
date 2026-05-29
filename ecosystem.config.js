module.exports = {
  apps: [
    // ── Backend (NestJS) ───────────────────────────────────────────────────
    {
      name:         'estatelance-api',
      cwd:          './estatelance-api',
      script:       'node_modules/.bin/nest',
      args:         'start',
      instances:    1,
      exec_mode:    'fork',
      watch:        false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV:    'production',
        PORT:        3007,
      },
      error_file:   './logs/api-error.log',
      out_file:     './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts:  10,
    },

    // ── Frontend (Next.js) ─────────────────────────────────────────────────
    {
      name:         'estatelance-web',
      cwd:          './estatelance-next',
      script:       'node_modules/.bin/next',
      args:         'start -p 3000',
      instances:    1,
      exec_mode:    'fork',
      watch:        false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT:     3000,
      },
      error_file:   './logs/web-error.log',
      out_file:     './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts:  10,
    },
  ],
};
