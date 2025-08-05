/**
 * Custom error class for validation failures in object creation.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validation error codes for consistent error handling.
 */
export const ValidationErrorCodes = {
  PARENT_NOT_FOUND: "PARENT_NOT_FOUND",
  INVALID_PARENT_TYPE: "INVALID_PARENT_TYPE",
} as const;

export type ValidationErrorCode =
  (typeof ValidationErrorCodes)[keyof typeof ValidationErrorCodes];
