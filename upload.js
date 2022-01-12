const { create } = require('@actions/artifact');
const core = require('@actions/core');
const path = require('path');
const fs = require('fs-extra');

async function main() {
  const tempDir = path.join(
    process.env['RUNNER_TEMP'] || __dirname,
    'turbo-cache'
  );

  fs.ensureDirSync(tempDir);

  const client = create();

  const files = fs.readdirSync(tempDir);

  const artifactFiles = files.filter(filename => filename.endsWith('.gz'));

  await Promise.all(artifactFiles.map(artifactFilename => {
    const filenameWithoutExt = path.basename(artifactFilename, path.extname(artifactFilename));
    core.debug(`Uploading ${artifactFilename}`);
    return client.uploadArtifact(filenameWithoutExt, artifactFilename, tempDir);
  }));
}

main().catch(console.error);
