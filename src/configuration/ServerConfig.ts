export interface ServerConfig {
  mode: "local" | "remote";
  planningRootFolder?: string;
  remoteRepositoryUrl?: string;
  remoteProjectId?: string;
  remoteRepositoryApiToken?: string;
  autoCompleteParent: boolean;
  autoPrune: number;
}
