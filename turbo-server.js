const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const asyncHandler = require("express-async-handler");
const { artifactApi } = require("./artifactApi");
const { downloadArtifact } = require("./download");

async function startServer() {
  const port = process.env.PORT || 9080;
  const tempDir = path.join(
    process.env["RUNNER_TEMP"] || __dirname,
    "turbo-cache"
  );

  fs.ensureDirSync(tempDir);

  const app = express();

  app.all("*", (req, res, next) => {
    console.info(`Got a ${req.method} request`, req.path);
    next();
  });

  app.get(
    "/v8/artifacts/:artifactId",
    asyncHandler(async (req, res) => {
      const { artifactId } = req.params;
      const list = await artifactApi.listArtifacts();
      console.log(`Found ${list.total_count} artifacts.`);

      const existingArtifact = list.artifacts.find(
        (artifact) => artifact.name === artifactId
      );

      if (existingArtifact) {
        console.log(`Artifact ${artifactId} found.`);
        await downloadArtifact(existingArtifact, tempDir);
        console.log(
          `Artifact ${artifactId} downloaded successfully to ${tempDir}/${artifactId}.gz.`
        );
      }

      const filepath = path.join(tempDir, `${artifactId}.gz`);

      if (!fs.pathExistsSync(filepath)) {
        console.log(`Artifact ${artifactId} not found.`);
        return res.status(404).send("Not found");
      }

      const readStream = fs.createReadStream(filepath);
      readStream.on("open", () => {
        readStream.pipe(res);
      });

      readStream.on("error", (err) => {
        console.error(err);
        res.end(err);
      });
    })
  );

  app.put("/v8/artifacts/:artifactId", (req, res) => {
    const artifactId = req.params.artifactId;
    const filename = `${artifactId}.gz`;

    const writeStream = fs.createWriteStream(path.join(tempDir, filename));

    // This pipes the POST data to the file
    req.pipe(writeStream);

    writeStream.on("error", (err) => {
      console.error(err);
      res.status(500).send("ERROR");
    });

    // After all the data is saved, respond with a simple html form so they can post more data
    req.on("end", () => {
      res.send("OK");
    });
  });

  app.disable("etag");

  app.listen(port, () => {
    console.log(`Cache dir: ${tempDir}`);
    console.log(`Local Turbo server is listening at http://127.0.0.1:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
