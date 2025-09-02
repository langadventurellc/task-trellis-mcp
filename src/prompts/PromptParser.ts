import { readFile } from "fs/promises";
import { basename } from "path";
import { parse } from "yaml";
import { TrellisPrompt } from "./TrellisPrompt";
import { PromptArgument } from "./PromptArgument";

/**
 * Parses a markdown prompt file with YAML frontmatter into a TrellisPrompt object.
 * Extracts frontmatter metadata, processes system rules, and validates the structure.
 */
export async function parsePromptFile(
  filePath: string,
): Promise<TrellisPrompt> {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    const promptName = generatePromptName(filePath);

    const { frontmatter, body } = extractFrontmatterAndBody(fileContent);
    const { rules, cleanContent } = extractSystemRules(body);

    const promptData = buildPromptData(
      promptName,
      frontmatter,
      rules,
      cleanContent,
    );
    validatePromptData(promptData, filePath);

    return promptData;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to parse prompt file ${filePath}: ${errorMessage}`);
  }
}

// Helper functions (private, not exported)

/**
 * Extracts and removes <rules>...</rules> blocks from content.
 * Returns both the extracted rules and the cleaned content.
 */
function extractSystemRules(content: string): {
  rules: string | undefined;
  cleanContent: string;
} {
  const rulesRegex = /<rules>([\s\S]*?)<\/rules>/gi;
  const matches = content.match(rulesRegex);

  if (!matches || matches.length === 0) {
    return { rules: undefined, cleanContent: content };
  }

  // Extract content from all rules blocks
  const rulesContent = matches
    .map((match) => match.replace(/<\/?rules>/gi, "").trim())
    .filter((rule) => rule.length > 0)
    .join("\n\n");

  // Remove all rules blocks from content
  const cleanContent = content.replace(rulesRegex, "").trim();

  return {
    rules: rulesContent.length > 0 ? rulesContent : undefined,
    cleanContent,
  };
}

/**
 * Validates that parsed prompt data meets all requirements.
 * Throws descriptive errors for invalid prompts.
 */
function validatePromptData(data: TrellisPrompt, filePath: string): void {
  // Validate required fields
  if (!data.name) {
    throw new Error(`Missing prompt name in ${filePath}`);
  }

  if (!data.description) {
    throw new Error(
      `Missing required 'description' field in frontmatter for ${filePath}`,
    );
  }

  if (!data.userTemplate || data.userTemplate.trim().length === 0) {
    throw new Error(`Empty prompt body in ${filePath}`);
  }

  // Validate kebab-case name
  if (!/^[a-z]+(-[a-z]+)*$/.test(data.name)) {
    throw new Error(
      `Invalid prompt name '${data.name}' in ${filePath}. Must be kebab-case.`,
    );
  }

  // Validate unique argument names
  const argNames = new Set<string>();
  for (const arg of data.arguments) {
    if (!arg.name) {
      throw new Error(`Missing argument name in ${filePath}`);
    }
    if (argNames.has(arg.name)) {
      throw new Error(`Duplicate argument name '${arg.name}' in ${filePath}`);
    }
    argNames.add(arg.name);

    // Validate argument fields
    if (arg.type && arg.type !== "string" && arg.type !== "boolean") {
      throw new Error(
        `Invalid argument type '${String(arg.type)}' for '${arg.name}' in ${filePath}`,
      );
    }
    if (typeof arg.required !== "boolean") {
      throw new Error(
        `Invalid 'required' value for argument '${arg.name}' in ${filePath}`,
      );
    }
    if (!arg.description) {
      throw new Error(
        `Missing description for argument '${arg.name}' in ${filePath}`,
      );
    }
  }
}

function extractFrontmatterAndBody(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error(
      "Invalid format: Expected YAML frontmatter delimited by --- markers",
    );
  }

  const [, yamlContent, bodyContent] = match;

  let frontmatter: unknown;
  try {
    frontmatter = parse(yamlContent);
  } catch (error) {
    throw new Error(
      `Invalid YAML frontmatter: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  if (
    !frontmatter ||
    typeof frontmatter !== "object" ||
    Array.isArray(frontmatter)
  ) {
    throw new Error("Invalid YAML frontmatter: Expected an object");
  }

  return {
    frontmatter: frontmatter as Record<string, unknown>,
    body: bodyContent.trim(),
  };
}

function generatePromptName(filePath: string): string {
  const fileName = basename(filePath, ".md");
  return fileName.toLowerCase().replace(/_/g, "-");
}

function buildPromptData(
  name: string,
  frontmatter: Record<string, unknown>,
  systemRules: string | undefined,
  userTemplate: string,
): TrellisPrompt {
  // Build arguments array with default if not specified
  const args = parseArguments(frontmatter.args);

  return {
    name,
    title:
      typeof frontmatter.title === "string" ? frontmatter.title : undefined,
    description:
      typeof frontmatter.description === "string"
        ? frontmatter.description
        : "",
    arguments: args,
    systemRules,
    userTemplate,
  };
}

function parseArguments(args: unknown): PromptArgument[] {
  // Default to single 'input' argument if not specified
  if (!args) {
    return [
      {
        name: "input",
        required: false,
        description: "Free-text input",
      },
    ];
  }

  if (!Array.isArray(args)) {
    throw new Error("Invalid 'args' field: Expected an array");
  }

  return args.map((arg, index) => {
    if (!arg || typeof arg !== "object" || Array.isArray(arg)) {
      throw new Error(`Invalid argument at index ${index}: Expected an object`);
    }

    const argObj = arg as Record<string, unknown>;

    const argType = argObj.type;
    const validatedType =
      argType === "boolean"
        ? "boolean"
        : argType === "string"
          ? "string"
          : argType;

    return {
      name: typeof argObj.name === "string" ? argObj.name : "",
      type: validatedType as "string" | "boolean" | undefined,
      required: Boolean(argObj.required),
      description:
        typeof argObj.description === "string" ? argObj.description : "",
    };
  });
}
