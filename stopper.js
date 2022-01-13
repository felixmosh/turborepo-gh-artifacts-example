const core = require("@actions/core");
const path = require("path");
const fs = require("fs-extra");
const { create } = require("@actions/artifact");
const { artifactApi } = require("./artifactApi");

const cachefolder = path.join(
  process.env["RUNNER_TEMP"] || __dirname,
  "turbo-cache"
);

fs.ensureDirSync(cachefolder);

function pidIsRunning(pid) {
  try {
    process.kill(+pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

async function upload() {
  const list = await artifactApi.listArtifacts();
  const existingArtifacts = list.artifacts.map((artifact) => artifact.name);

  const client = create();

  const files = fs.readdirSync(cachefolder);

  const artifactFiles = files.filter((filename) => filename.endsWith(".gz"));

  core.debug(`artifact files: ${JSON.stringify(artifactFiles, null, 2)}`);

  await Promise.all(
    artifactFiles
      .map((artifactFilename) => {
        const artifactId = path.basename(
          artifactFilename,
          path.extname(artifactFilename)
        );

        return { artifactFilename, artifactId };
      })
      .filter(({ artifactId }) => !existingArtifacts.includes(artifactId))
      .map(async ({ artifactFilename, artifactId }) => {
        core.info(`Uploading ${artifactFilename}`);

        await client.uploadArtifact(
          artifactId,
          [path.join(cachefolder, artifactFilename)],
          cachefolder
        );

        core.info(`Uploaded ${artifactFilename} successfully`);
      })
  );
}

function stopServer() {
  const serverPID = core.getState("TURBO_LOCAL_SERVER_PID");

  core.info(`Found server pid: ${serverPID}`);

  if (serverPID && pidIsRunning(serverPID)) {
    core.info(`Killing server pid: ${serverPID}`);
    process.kill(+serverPID);
  } else {
    core.info(`Server with pid: ${serverPID} is not running`);
  }
}

function printServerLogs() {
  core.info("Server logs:");
  core.info(
    fs.readFileSync(path.join(cachefolder, "out.log"), {
      encoding: "utf8",
      flag: "r",
    })
  );
}

async function stopper() {
  stopServer();

  await upload();

  printServerLogs();
}

stopper().catch((error) => {
  core.error(error);
  core.setFailed(`Stop server failed due to ${error}.`);
});
