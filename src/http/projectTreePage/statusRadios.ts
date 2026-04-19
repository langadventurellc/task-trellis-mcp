import { STATUS_LABELS } from "./statusLabels";

/** Renders segmented radio inputs for status selection. */
export function statusRadios(selected: string): string {
  return STATUS_LABELS.map(
    ([value, label]) =>
      `<label><input type="radio" name="status" value="${value}"${selected === value ? " checked" : ""} /> ${label}</label>`,
  ).join("\n");
}
