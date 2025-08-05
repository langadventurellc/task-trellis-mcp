export default interface ServerConfig {
  mode: "local" | "remote";
  localRepositoryPath?: string;
  remoteRepositoryUrl?: string;
  remoteRepositoryApiToken?: string;
}
