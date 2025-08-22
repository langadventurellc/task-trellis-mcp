import { ServerConfig } from "../../configuration";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories";
import { TaskTrellisService } from "../TaskTrellisService";

export class LocalTaskTrellisService implements TaskTrellisService {
  async createObject(
    repository: Repository,
    type: TrellisObjectType,
    title: string,
    parent?: string,
    priority: TrellisObjectPriority = TrellisObjectPriority.MEDIUM,
    status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
    prerequisites: string[] = [],
    description: string = "",
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { createObject } = await import("./createObject");
    return createObject(
      repository,
      type,
      title,
      parent,
      priority,
      status,
      prerequisites,
      description,
    );
  }

  async updateObject(
    repository: Repository,
    id: string,
    priority?: TrellisObjectPriority,
    prerequisites?: string[],
    body?: string,
    status?: TrellisObjectStatus,
    force: boolean = false,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { updateObject } = await import("./updateObject");
    return updateObject(
      repository,
      id,
      priority,
      prerequisites,
      body,
      status,
      force,
    );
  }

  async claimTask(
    repository: Repository,
    scope?: string,
    taskId?: string,
    force: boolean = false,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { claimTask } = await import("./claimTask");
    return claimTask(repository, scope, taskId, force);
  }

  async completeTask(
    repository: Repository,
    taskId: string,
    summary: string,
    filesChanged: Record<string, string>,
    serverConfig?: ServerConfig,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { completeTask } = await import("./completeTask");
    return completeTask(
      repository,
      taskId,
      summary,
      filesChanged,
      serverConfig,
    );
  }

  async listObjects(
    repository: Repository,
    type: TrellisObjectType,
    scope?: string,
    status?: TrellisObjectStatus,
    priority?: TrellisObjectPriority,
    includeClosed: boolean = false,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { listObjects } = await import("./listObjects");
    return listObjects(
      repository,
      type,
      scope,
      status,
      priority,
      includeClosed,
    );
  }

  async appendObjectLog(
    repository: Repository,
    id: string,
    contents: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { appendObjectLog } = await import("./appendObjectLog");
    return appendObjectLog(repository, id, contents);
  }

  async appendModifiedFiles(
    repository: Repository,
    id: string,
    filesChanged: Record<string, string>,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { appendModifiedFiles } = await import("./appendModifiedFiles");
    return appendModifiedFiles(repository, id, filesChanged);
  }
}
