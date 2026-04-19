/** Maps a status value to its CSS class name. */
export function statusCssClass(status: string): string {
  if (status === "in-progress") return "progress";
  if (status === "wont-do") return "wontdo";
  return status;
}
