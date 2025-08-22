import { ServerConfig } from "../configuration";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../models";
import { Repository } from "../repositories";

export interface TaskTrellisService {
  /**
   * Creates a new object in the task trellis system
   */
  createObject(
    repository: Repository,
    type: TrellisObjectType,
    title: string,
    parent?: string,
    priority?: TrellisObjectPriority,
    status?: TrellisObjectStatus,
    prerequisites?: string[],
    description?: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;

  /**
   * Updates an existing object in the task trellis system
   */
  updateObject(
    repository: Repository,
    id: string,
    title?: string,
    priority?: TrellisObjectPriority,
    prerequisites?: string[],
    body?: string,
    status?: TrellisObjectStatus,
    force?: boolean,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;

  /**
   * Claims a task in the task trellis system
   */
  claimTask(
    repository: Repository,
    scope?: string,
    taskId?: string,
    force?: boolean,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;

  /**
   * Completes a task in the task trellis system
   */
  completeTask(
    repository: Repository,
    taskId: string,
    summary: string,
    filesChanged: Record<string, string>,
    serverConfig?: ServerConfig,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;

  /**
   * Lists objects from the task trellis system
   */
  listObjects(
    repository: Repository,
    type: TrellisObjectType,
    scope?: string,
    status?: TrellisObjectStatus,
    priority?: TrellisObjectPriority,
    includeClosed?: boolean,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;

  /**
   * Appends content to an object's log in the task trellis system
   */
  appendObjectLog(
    repository: Repository,
    id: string,
    contents: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;

  /**
   * Appends modified files information to a trellis object
   */
  appendModifiedFiles(
    repository: Repository,
    id: string,
    filesChanged: Record<string, string>,
  ): Promise<{ content: Array<{ type: string; text: string }> }>;
}
