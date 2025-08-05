---
kind: task
id: T-test-file-system-integration-and
title: Test file system integration and data persistence
status: open
priority: normal
prerequisites:
  - T-implement-createobject-e2e-tests
  - T-implement-getobject-e2e-tests
  - T-implement-updateobject-e2e-tests
  - T-implement-deleteobject-e2e-tests
  - T-implement-listobjects-e2e-tests
  - T-implement-file-validation-e2e
created: "2025-08-05T16:41:18.098587"
updated: "2025-08-05T16:41:18.098587"
schema_version: "1.1"
---

Test file system operations and data persistence through MCP protocol.

## Test Location and Structure

Create tests in: `src/__tests__/e2e/filesystem/`

### Directory Structure to Create:

```
src/
  __tests__/
    e2e/
      filesystem/
        directoryStructure.e2e.test.ts  # Test .trellis directory organization
        fileOperations.e2e.test.ts      # Test markdown file CRUD
        persistence.e2e.test.ts         # Test data persistence across restarts
        encoding.e2e.test.ts            # Test UTF-8 and special characters
        errors.e2e.test.ts              # Test file system error handling
        performance.e2e.test.ts         # Test large hierarchies
```

### Test Template Structure:

```typescript
import { TestEnvironment } from '../utils/testEnvironment';
import { McpTestClient } from '../utils/mcpTestClient';
import { readFile, writeFile, chmod, readdir, stat } from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

describe('File System Integration E2E', () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    client = new McpTestClient(testEnv.serverProcess);
    await client.connect();
    await client.callTool('activate', {
      mode: 'local',
      projectRoot: testEnv.projectRoot
    });
  });

  afterEach(async () => {
    await client?.disconnect();
    await testEnv?.cleanup();
  });

  describe('Directory Structure', () => {
    it('should create proper hierarchical directory structure', async () => {
      // Create a full hierarchy: Project -> Epic -> Feature -> Task
      const projectResponse = await client.callTool('create_object', {
        type: 'project',
        title: 'Test Project'
      });
      const projectId = projectResponse.content[0].text.match(/ID: (P-[^\\s]+)/)[1];

      const epicResponse = await client.callTool('create_object', {
        type: 'epic',
        title: 'Test Epic',
        parent: projectId
      });
      const epicId = epicResponse.content[0].text.match(/ID: (E-[^\\s]+)/)[1];

      // Verify directory structure
      const projectDir = path.join(testEnv.trellisDir, 'p', projectId);
      const epicDir = path.join(projectDir, 'e', epicId);

      expect(await stat(projectDir)).toBeTruthy();
      expect(await stat(epicDir)).toBeTruthy();

      // Verify files exist
      const projectFile = path.join(projectDir, \`\${projectId}.md\`);
      const epicFile = path.join(epicDir, \`\${epicId}.md\`);

      expect(await stat(projectFile)).toBeTruthy();
      expect(await stat(epicFile)).toBeTruthy();
    });
  });

  describe('YAML Front-matter', () => {
    it('should create valid YAML front-matter structure', async () => {
      const response = await client.callTool('create_object', {
        type: 'task',
        title: 'Test Task',
        priority: 'high',
        status: 'open',
        prerequisites: ['T-prereq-1', 'T-prereq-2']
      });

      const taskId = response.content[0].text.match(/ID: (T-[^\\s]+)/)[1];
      const taskFile = await testEnv.getTaskFile(taskId);
      const content = await readFile(taskFile, 'utf-8');

      const parts = content.split('---\\n');
      expect(parts).toHaveLength(3); // empty, front-matter, body

      const frontMatter = yaml.parse(parts[1]);
      expect(frontMatter).toMatchObject({
        kind: 'task',
        id: taskId,
        title: 'Test Task',
        status: 'open',
        priority: 'high',
        prerequisites: ['T-prereq-1', 'T-prereq-2'],
        created: expect.any(String),
        updated: expect.any(String),
        schema_version: '1.1'
      });
    });
  });
});
```

## Test Implementation Requirements:

1. **Directory Structure Tests** (`directoryStructure.e2e.test.ts`):
   - Test creation of .trellis root directory
   - Test subdirectory creation (p/, e/, f/, t/, closed/, open/)
   - Test hierarchical nesting (project/epic/feature/task)
   - Verify correct directory permissions
   - Test directory cleanup on object deletion

2. **File Operations Tests** (`fileOperations.e2e.test.ts`):
   - Test markdown file creation with proper naming
   - Test YAML front-matter format and required fields
   - Test markdown body content preservation
   - Test file updates (title, status, content changes)
   - Test file deletion and cleanup
   - Test atomic file operations (no partial writes)

3. **Persistence Tests** (`persistence.e2e.test.ts`):
   - Test data survives server restart
   - Test recovery from incomplete operations
   - Test file system consistency after crashes
   - Test loading existing .trellis directories
   - Test migration between schema versions

4. **Encoding Tests** (`encoding.e2e.test.ts`):
   - Test UTF-8 character handling in titles and descriptions
   - Test special characters in YAML values
   - Test emoji and Unicode characters
   - Test line ending preservation (LF vs CRLF)
   - Test file encoding detection and validation

5. **Error Handling Tests** (`errors.e2e.test.ts`):
   - Test handling of read-only directories/files
   - Test disk space exhaustion scenarios
   - Test network drive disconnection (if applicable)
   - Test file corruption recovery
   - Test permission denied scenarios
   - Test concurrent file access conflicts

6. **Performance Tests** (`performance.e2e.test.ts`):
   - Test with large numbers of objects (1000+ tasks)
   - Test deep hierarchical nesting performance
   - Test file system scan performance on startup
   - Test large markdown file handling
   - Test directory traversal performance

## Test Data Validation:

- **File Structure**: Verify each object type creates correct directory/file structure
- **YAML Validation**: Use yaml parser to validate front-matter syntax
- **Content Integrity**: Verify no data corruption during file operations
- **Atomic Operations**: Ensure partial writes don't leave corrupted files

### Log
