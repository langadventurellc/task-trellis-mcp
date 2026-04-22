import { renderEditForm } from "../renderEditForm";

const baseFields = {
  title: "T",
  status: "open",
  priority: "medium",
  body: "",
  prerequisites: "",
};

it("renders externalIssueId input when isTopLevel is true", () => {
  const html = renderEditForm("k", "P-x", {
    ...baseFields,
    isTopLevel: true,
    externalIssueId: "JIRA-42",
  });
  expect(html).toContain('name="externalIssueId"');
  expect(html).toContain('value="JIRA-42"');
});

it("does not render externalIssueId input when isTopLevel is false", () => {
  const html = renderEditForm("k", "P-x", {
    ...baseFields,
    isTopLevel: false,
  });
  expect(html).not.toContain('name="externalIssueId"');
});
