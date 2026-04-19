/** Renders segmented radio inputs for status selection. */
export function statusRadios(selected: string): string {
  return [
    ["draft", "Draft"],
    ["open", "Open"],
    ["in-progress", "In Progress"],
    ["done", "Done"],
    ["wont-do", "Won't Do"],
  ]
    .map(
      ([value, label]) =>
        `<label><input type="radio" name="status" value="${value}"${selected === value ? " checked" : ""} /> ${label}</label>`,
    )
    .join("\n");
}
