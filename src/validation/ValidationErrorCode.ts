import { ValidationErrorCodes } from "./ValidationErrorCodes";

export type ValidationErrorCode =
  (typeof ValidationErrorCodes)[keyof typeof ValidationErrorCodes];
