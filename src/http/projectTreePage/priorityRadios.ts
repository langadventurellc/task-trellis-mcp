import { priorityCssClass } from "./priorityCssClass";

/** Renders the designer's .seg segmented-control radios for priority selection. */
export function priorityRadios(selected: string, prefix = "p"): string {
  return [
    ["high", "High"],
    ["medium", "Medium"],
    ["low", "Low"],
  ]
    .map(([value, label]) => {
      const id = `${prefix}-${value}`;
      const checked = selected === value ? " checked" : "";
      const bar = `<span class="pbar ${priorityCssClass(value)}"></span>`;
      return `<input type="radio" id="${id}" name="priority" value="${value}"${checked}><label for="${id}">${bar}${label}</label>`;
    })
    .join("");
}
