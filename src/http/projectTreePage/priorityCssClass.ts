/** Maps a priority value to its CSS class name. */
export function priorityCssClass(priority: string): string {
  return priority === "medium" ? "med" : priority;
}
