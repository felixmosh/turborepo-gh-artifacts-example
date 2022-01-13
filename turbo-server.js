const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const { create } = require("@actions/artifact");
const asyncHandler = require("express-async-handler");
const http = require('https');

async function startServer() {
  const port = process.env.PORT || 9080;
  const tempDir = path.join(
    process.env["RUNNER_TEMP"] || __dirname,
    "turbo-cache"
  );

  fs.ensureDirSync(tempDir);

  const app = express();
  const artifactClient = create();

  app.all("*", (req, res, next) => {
    console.info(
      `Got a ${req.method} request`,
      req.path,
      req.params,
      req.headers,
      req.query
    );
    next();
  });

  app.get(
    "/v8/artifacts/:artifactId",
    asyncHandler(async (req, res) => {
      const { artifactId } = req.params;

      const filename = `${artifactId}.gz`;


      const filepath = path.join(tempDir, filename);

      if (!fs.pathExistsSync(filepath)) {
        return res.status(404).send("Not found");
      }

      const readStream = fs.createReadStream(filepath);
      readStream.on("open", function () {
        // This just pipes the read stream to the response object (which goes to the client)
        readStream.pipe(res);
      });

      // This catches any errors that happen while creating the readable stream (usually invalid names)
      readStream.on("error", function (err) {
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
