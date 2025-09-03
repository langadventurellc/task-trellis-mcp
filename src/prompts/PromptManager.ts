import * as fs from "fs/promises";
import * as path from "path";
import { parsePromptFile } from "./PromptParser.js";
import { TrellisPrompt } from "./TrellisPrompt.js";

/**
 * Manages the lifecycle and caching of prompt templates
 */
export class PromptManager {
  private prompts: Map<string, TrellisPrompt>;
  private loaded: boolean;
  private promptPackage: string;

  constructor(promptPackage: string = "basic") {
    this.prompts = new Map<string, TrellisPrompt>();
    this.loaded = false;
    this.promptPackage = promptPackage;
  }

  /**
   * Loads all prompts from the configured prompt package directory
   * This method should be called once during application startup
   */
  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const promptsDir = path.join(
      __dirname,
      "..",
      "resources",
      this.promptPackage,
      "prompts",
    );

    if (!(await this.checkDirectoryExists(promptsDir))) {
      this.loaded = true;
      return;
    }

    await this.loadPromptsFromDirectory(promptsDir);
  }

  /**
   * Checks if the prompts directory exists
   */
  private async checkDirectoryExists(promptsDir: string): Promise<boolean> {
    try {
      await fs.access(promptsDir);
      return true;
    } catch {
      console.error(
        `Prompts directory does not exist for package '${this.promptPackage}': ${promptsDir}`,
      );
      return false;
    }
  }

  /**
   * Loads all prompt files from the specified directory
   */
  private async loadPromptsFromDirectory(promptsDir: string): Promise<void> {
    try {
      const files = await fs.readdir(promptsDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      for (const file of mdFiles) {
        await this.loadSinglePrompt(path.join(promptsDir, file), file);
      }

      this.loaded = true;
      console.error(
        `Loaded ${this.prompts.size} prompts from package '${this.promptPackage}' (${mdFiles.length} files)`,
      );
    } catch (error) {
      console.error("Failed to read prompts directory:", error);
      this.loaded = true;
    }
  }

  /**
   * Loads a single prompt file
   */
  private async loadSinglePrompt(
    filePath: string,
    fileName: string,
  ): Promise<void> {
    try {
      const prompt = await parsePromptFile(filePath);

      if (!prompt.name) {
        console.error(`Invalid prompt file ${fileName}: missing name`);
        return;
      }

      if (this.prompts.has(prompt.name)) {
        console.error(
          `Duplicate prompt name "${prompt.name}" found in file ${fileName}`,
        );
        return;
      }

      this.prompts.set(prompt.name, prompt);
    } catch (error) {
      console.error(`Failed to parse prompt file ${fileName}:`, error);
    }
  }

  /**
   * Returns all loaded prompts
   */
  list(): TrellisPrompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Gets a specific prompt by name
   */
  get(name: string): TrellisPrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * Checks if a prompt exists
   */
  has(name: string): boolean {
    return this.prompts.has(name);
  }

  /**
   * Returns the number of loaded prompts
   */
  size(): number {
    return this.prompts.size;
  }

  /**
   * Clears all cached prompts (mainly for testing)
   */
  clear(): void {
    this.prompts.clear();
    this.loaded = false;
  }
}
