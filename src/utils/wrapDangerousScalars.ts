import { Scalar } from "yaml";

/**
 * Recursively wraps any string scalar containing a bare `---` line as a QUOTE_DOUBLE Scalar node,
 * preventing yaml.stringify from emitting bare `---` lines inside frontmatter that would confuse
 * the frontmatter extractor.
 * Example: wrapDangerousScalars("line1\n---\nline2") → Scalar node with type QUOTE_DOUBLE.
 * Strings with `---` only mid-line (e.g. "see config---v2.yml") are left unchanged.
 */
export function wrapDangerousScalars(obj: unknown): unknown {
  if (typeof obj === "string") {
    if (/^---$/m.test(obj)) {
      // QUOTE_DOUBLE prevents block-literal style, which would emit bare --- lines
      // that confuse the frontmatter extractor. Escalate if yaml overrides this type hint.
      const scalar = new Scalar(obj);
      scalar.type = Scalar.QUOTE_DOUBLE;
      return scalar;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(wrapDangerousScalars);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        wrapDangerousScalars(v),
      ]),
    );
  }
  return obj;
}
