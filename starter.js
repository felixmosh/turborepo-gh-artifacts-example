const core = require("@actions/core");
const path = require("path");
const fs = require("fs-extra");
const { spawn } = require("child_process");

const tempDir = path.join(
  process.env["RUNNER_TEMP"] || __dirname,
  "turbo-cache"
);

fs.ensureDirSync(tempDir);

const out = fs.openSync(path.join(tempDir, "./out.log"), "a");
const err = fs.openSync(path.join(tempDir, "./out.log"), "a");

const subprocess = spawn("node", ["turbo-server.js"], {
  detached: true,
  stdio: ["ignore", out, err],
  env: process.env,
});

subprocess.unref();

core.info(`TURBO_LOCAL_SERVER_PID: ${subprocess.pid}`);
core.saveState("TURBO_LOCAL_SERVER_PID", subprocess.pid);
