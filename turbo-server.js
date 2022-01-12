const express = require("express");
const app = express();
const port = process.env.PORT || 9080;
const fs = require("fs-extra");
const path = require("path");

const tempDir = process.env['RUNNER_TEMP'] || path.join(__dirname, "cache");

async function startServer() {
  app.all("*", (req, res, next) => {
    console.log(
      `Got a ${req.method} request`,
      req.path,
      req.params,
      req.headers,
      req.query
    );
    next();
  });

  app.get("/v8/artifacts/:artifactId", (req, res) => {
    const filename = `${req.params.artifactId}.gz`;
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
      res.end(err);
    });
  });

  app.put("/v8/artifacts/:artifactId", (req, res) => {
    const filename = `${req.params.artifactId}.gz`;
    fs.ensureDirSync(tempDir);

    const writeStream = fs.createWriteStream(path.join(tempDir, filename));

    // This pipes the POST data to the file
    req.pipe(writeStream);

    writeStream.on("error", (err) => {
      console.log(err);
    });

    // After all the data is saved, respond with a simple html form so they can post more data
    req.on("end", () => {
      res.send("OK");
    });
  });

  app.listen(port, () => {
    console.log(`Temp dir: ${tempDir}`);
    console.log(`Example app listening at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
