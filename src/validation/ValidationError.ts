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
