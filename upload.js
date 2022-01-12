const { create } = require('@actions/artifact');
const path = require('path');
const fs = require('fs-extra');

const cacheDir = path.join(__dirname, 'cache');

async function  main() {
  const client = create();

  await client.uploadArtifact()
}

main().catch(console.error)
