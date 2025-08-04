export interface TrellisObject {
  id: string;
  title: string;
  status: string;
  priority: string;
  prerequisites: string[];
  affectedFiles: Map<string, string>;
  log: string[];
  schema: string;
  childrenIds: string[];
  body: string;
}
