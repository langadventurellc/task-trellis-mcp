import { statusCssClass } from "./statusCssClass";
import { STATUS_LABELS } from "./statusLabels";

/** Renders the designer's .seg segmented-control radios for status selection. */
export function statusRadios(selected: string, prefix = "s"): string {
  return STATUS_LABELS.map(([value, label]) => {
    const id = `${prefix}-${value}`;
    const checked = selected === value ? " checked" : "";
    const dot = `<span class="sdot ${statusCssClass(value)}"></span>`;
    return `<input type="radio" id="${id}" name="status" value="${value}"${checked}><label for="${id}">${dot}${label}</label>`;
  }).join("");
}
