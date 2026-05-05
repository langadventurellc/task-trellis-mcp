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
    externalIssueId?: string,
    labels?: string[],
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
      externalIssueId,
      labels,
    );
  }

  async updateObject(
    repository: Repository,
    serverConfig: ServerConfig,
    id: string,
    title?: string,
    priority?: TrellisObjectPriority,
    prerequisites?: string[],
    body?: string,
    status?: TrellisObjectStatus,
    force: boolean = false,
    externalIssueId?: string,
    labels?: string[],
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { updateObject } = await import("./updateObject");
    return updateObject(
      repository,
      serverConfig,
      id,
      title,
      priority,
      prerequisites,
      body,
      status,
      force,
      externalIssueId,
      labels,
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

  async getNextAvailableIssue(
    repository: Repository,
    scope?: string,
    issueType?: TrellisObjectType | TrellisObjectType[],
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const { getNextAvailableIssue } = await import("./getNextAvailableIssue");
      const foundIssue = await getNextAvailableIssue(
        repository,
        scope,
        issueType,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(foundIssue, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding next available issue: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }

  async completeTask(
    repository: Repository,
    serverConfig: ServerConfig,
    taskId: string,
    summary: string,
    filesChanged: Record<string, string>,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { completeTask } = await import("./completeTask");
    return completeTask(
      repository,
      serverConfig,
      taskId,
      summary,
      filesChanged,
    );
  }

  async listObjects(
    repository: Repository,
    type?: TrellisObjectType | TrellisObjectType[],
    scope?: string,
    status?: TrellisObjectStatus | TrellisObjectStatus[],
    priority?: TrellisObjectPriority | TrellisObjectPriority[],
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

  async pruneClosed(
    repository: Repository,
    age: number,
    scope?: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { pruneClosed } = await import("./pruneClosed");
    return pruneClosed(repository, age, scope);
  }

  async appendModifiedFiles(
    repository: Repository,
    id: string,
    filesChanged: Record<string, string>,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { appendModifiedFiles } = await import("./appendModifiedFiles");
    return appendModifiedFiles(repository, id, filesChanged);
  }

  async addAttachment(
    repository: Repository,
    id: string,
    sourcePath: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { addAttachment } = await import("./addAttachment");
    return addAttachment(repository, id, sourcePath);
  }

  async removeAttachment(
    repository: Repository,
    id: string,
    filename: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { removeAttachment } = await import("./removeAttachment");
    return removeAttachment(repository, id, filename);
  }

  async writeProjectFile(
    repository: Repository,
    filename: string,
    content: string,
    failIfExists?: boolean,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { writeProjectFile } = await import("./writeProjectFile");
    return writeProjectFile(repository, filename, content, failIfExists);
  }

  async readProjectFile(
    repository: Repository,
    filename: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { readProjectFile } = await import("./readProjectFile");
    return readProjectFile(repository, filename);
  }

  async listProjectFiles(
    repository: Repository,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { listProjectFiles } = await import("./listProjectFiles");
    return listProjectFiles(repository);
  }

  async deleteProjectFile(
    repository: Repository,
    filename: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { deleteProjectFile } = await import("./deleteProjectFile");
    return deleteProjectFile(repository, filename);
  }
}
