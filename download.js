const { artifactApi } = require("./artifactApi");
const fs = require("fs-extra");
const path = require("path");
const StreamZip = require("node-stream-zip");

const tempArchiveFolder = path.join(
  process.env["RUNNER_TEMP"],
  "turbo-archives"
);

async function downloadArtifact(artifact, destFolder) {
  const { data } = await artifactApi.downloadArtifact(artifact.id);
  const archiveFilepath = path.join(tempArchiveFolder, `${artifact.name}.zip`);

  fs.ensureDirSync(tempArchiveFolder);

  const writeStream = fs.createWriteStream(archiveFilepath);

  await new Promise((resolve) => {
    data.pipe(writeStream);
    writeStream.on("finish", () => {
      resolve();
    });

    writeStream.on("error", (error) => {
      console.error(error);
      resolve();
    });
  });

  const zip = new StreamZip.async({ file: archiveFilepath });
  await zip.extract(null, destFolder);
  await zip.close();
}

module.exports = { downloadArtifact };
