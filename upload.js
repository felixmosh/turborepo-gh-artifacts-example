const { create } = require("@actions/artifact");
const {
  DownloadHttpClient,
} = require("@actions/artifact/lib/internal/download-http-client");
const core = require("@actions/core");
const path = require("path");
const fs = require("fs-extra");

async function upload() {
  const tempDir = path.join(
    process.env["RUNNER_TEMP"] || __dirname,
    "turbo-cache"
  );

  fs.ensureDirSync(tempDir);

  const client = create();

  const files = fs.readdirSync(tempDir);

  const artifactFiles = files.filter((filename) => filename.endsWith(".gz"));

  core.debug(`artifact files: ${JSON.stringify(artifactFiles, null, 2)}`);

  const downloadHttpClient = new DownloadHttpClient();
  const artifacts = await downloadHttpClient.listArtifacts();
  const existingArtifacts = artifacts.value.map((artifact) => artifact.name);

  core.info(`existing artifacts ${JSON.stringify(existingArtifacts)}`);

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
          [path.join(tempDir, artifactFilename)],
          tempDir
        );

        core.info(`Uploaded ${artifactFilename} successfully`);
      })
  );
}

upload().catch(console.error);
