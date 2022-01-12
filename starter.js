const core = require("@actions/core");
const { spawn } = require('child_process');

const subprocess = spawn('node', ['turbo-server.js' ], {
  detached: true,
  stdio: 'inherit',
  env: process.env
});

subprocess.unref();

core.info(`TURBO_LOCAL_SERVER_PID: ${subprocess.pid}`);
core.saveState('TURBO_LOCAL_SERVER_PID', subprocess.pid);
