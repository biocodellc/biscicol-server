module.exports = {
  apps: [
    { name: 'arctos.api.v2.query', script: 'arctos.api.v2.query.js' },
    { name: 'arctos.api.v2.download', script: 'arctos.api.v2.download.js' },
  ].map(function (app) {
    return Object.assign(app, {
      cwd: __dirname,
      max_memory_restart: '300M',
      node_args: '--max_old_space_size=300',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    });
  }),
};
