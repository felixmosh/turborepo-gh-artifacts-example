const core = require("@actions/core");

function pidIsRunning(pid) {
  try {
    process.kill(+pid, 0);
    return true;
  } catch(e) {
    return false;
  }
}

async function stopper() {
  const serverPID = core.getState('TURBO_LOCAL_SERVER_PID');
  core.info(`Found server pid: ${serverPID}`);
  if(serverPID && pidIsRunning(serverPID)) {
    core.info(`killing server pid: ${serverPID}`);
    process.kill(+serverPID);
  } else {
    core.info(`server with pid: ${serverPID} is not running`);
  }
}

stopper().catch((error) => {
  core.error(error);
  core.setFailed(`Stop server failed due to ${error}.`);
});
