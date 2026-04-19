/** Renders segmented radio inputs for priority selection. */
export function priorityRadios(selected: string): string {
  return [
    ["high", "High"],
    ["medium", "Medium"],
    ["low", "Low"],
  ]
    .map(
      ([value, label]) =>
        `<label><input type="radio" name="priority" value="${value}"${selected === value ? " checked" : ""} /> ${label}</label>`,
    )
    .join("\n");
}
