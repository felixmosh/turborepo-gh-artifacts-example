const { create } = require('@actions/artifact');
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

  await Promise.all(artifactFiles.map(filename => {
    const filenameWithoutExt = path.basename(filename, path.extname(filename));

    return client.uploadArtifact(filenameWithoutExt, filename, tempDir);
  }));
}

main().catch(console.error);
