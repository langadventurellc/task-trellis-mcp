import { ValidationError } from "./ValidationError.js";
import { ValidationErrorCodes } from "./ValidationErrorCodes.js";

/**
 * Validates that each label in the array does not exceed 100 characters.
 * Throws a ValidationError with LABEL_TOO_LONG if any entry exceeds the limit.
 */
export function validateLabels(labels: string[]): void {
  for (let i = 0; i < labels.length; i++) {
    if (labels[i].length > 100) {
      throw new ValidationError(
        `Label at index ${i} exceeds 100 character limit (got ${labels[i].length})`,
        ValidationErrorCodes.LABEL_TOO_LONG,
        "labels",
      );
    }
  }
}
