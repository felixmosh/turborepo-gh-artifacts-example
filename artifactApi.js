const { Axios } = require("axios");
const core = require("@actions/core");

class ArtifactApi {
  constructor() {
    const repoToken = core.getInput("repo-token", {
      required: true,
      trimWhitespace: true,
    });
    this.axios = new Axios({
      baseURL: `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`,
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${repoToken}`,
      },
    });
  }

  listArtifacts() {
    return this.axios
      .get("/actions/artifacts", { per_page: 100 })
      .then((response) => response.data);
  }
}

module.exports = {
  artifactApi: new ArtifactApi(),
};
