# Issue Types

Task Trellis works with issues that are projects, epics, features or tasks.

## Tasks

**Tasks** are the most important type of issue. This is where the actual work gets done. Each task is a specific piece of work that needs to be completed in order to achieve the project's goals. The other issue types are too big to be a task and they exist to help organize and manage multiple tasks to accomplish a particular goal. Tasks can be standalone or part of a larger feature.

## Features

**Features** are the next level up from tasks. They represent the requirements and functionality needed to deliver a specific aspect of the project. Features can be standalone or a part of a larger epic.

## Epics

**Epics** are next after features. They represent a significant deliverable or a large body of work that can be broken down into multiple features and tasks. Epics can be standalone or a part of a larger project.

## Projects

**Projects** are the highest level of organization. They represent the overall initiative or goal that encompasses multiple epics, features, and tasks. Projects provide a way to group related work and track progress at a high level.

## Picking a Parent Issue Type

Depending on the size of the effort, you can choose to start with any of the above issue types. The larger the effort, the more likely you should start with a project or epic to properly organize the work. Smaller efforts can begin with features or just tasks for simple one-off efforts or for bugs. Once you have your tasks defined, you can easily manage and track their progress through the Task Trellis MCP tools.

Currently, all Task Trellis issues are stored as markdown files in the `.trellis` folder in the root of your project. This makes it unsuitable for projects with multiple developers, but a remote option is in development now and should be available soon. You can configure the storage location using command-line arguments, so you could use a shared network drive. See [Installation](installation.md#configuration-options)

## Prerequisites & Dependencies

Tasks can have prerequisites that must be completed before they become available:

```typescript
{
  "type": "task",
  "title": "Deploy authentication system",
  "prerequisites": ["T-user-registration", "T-login-system", "T-email-verification"]
}
```
