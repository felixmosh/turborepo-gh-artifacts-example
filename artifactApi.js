const { Axios } = require("axios");
const core = require("@actions/core");

class ArtifactApi {
  constructor() {
    const repoToken = core.getInput("repo-token", {
      required: true,
      trimWhitespace: true,
    });

    this.axios = new Axios({
      baseURL: `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/actions`,
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${repoToken}`,
      },
    });
  }

  listArtifacts() {
    return this.axios
      .get("/artifacts", { per_page: 100 })
      .then((response) => JSON.parse(response.data));
  }

  downloadArtifact(artifactId) {
    return this.axios.get(`/artifacts/${artifactId}/zip`, {responseType: 'stream'});
  }
}

module.exports = {
  artifactApi: new ArtifactApi(),
};
