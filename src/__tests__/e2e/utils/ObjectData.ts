export interface ObjectData {
  id: string;
  title: string;
  status?: string;
  priority?: string;
  parent?: string;
  prerequisites?: string[];
  affectedFiles?: Record<string, string>;
  log?: string[];
  schema?: string;
  childrenIds?: string[];
  body?: string;
  kind?: string;
  created?: string;
  updated?: string;
}
