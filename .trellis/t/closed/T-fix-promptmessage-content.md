---
id: T-fix-promptmessage-content
title: Fix PromptMessage content format for MCP SDK compatibility
status: done
priority: high
parent: none
prerequisites: []
affectedFiles:
  src/prompts/PromptMessage.ts: Updated PromptMessage interface to use single
    content object instead of array format
  src/prompts/PromptRenderer.ts: Updated renderPrompt method to create content as single object (lines 40, 47)
  src/prompts/PromptsRegistry.ts: Updated getPrompt return type to match new content format (line 66)
  src/prompts/__tests__/PromptRenderer.test.ts: Updated all test expectations to
    access content.text instead of content[0].text and content.type instead of
    content[0].type
log:
  - 'Successfully fixed PromptMessage content format for MCP SDK compatibility.
    Changed content from array format `[{ type: "text"; text: string }]` to
    single object format `{ type: "text", text: string }` to match MCP SDK
    expectations. Updated interface definition, implementation in
    PromptRenderer, PromptsRegistry return type, and all unit tests. All 733
    tests pass and quality checks (lint, format, type-check) are clean. This
    resolves validation errors when using prompts with Claude Code slash
    commands.'
schema: v1.0
childrenIds: []
created: 2025-09-02T23:37:58.570Z
updated: 2025-09-02T23:37:58.570Z
---

# Fix PromptMessage Content Format for MCP SDK Compatibility

## Context

The current MCP prompts implementation is failing validation when used with Claude Code slash commands. The error indicates a content format mismatch between our implementation and the MCP SDK specification.

**Root Cause Analysis:**

- Current `PromptMessage.content` is defined as `[{ type: "text"; text: string }]` (array format)
- MCP SDK expects `{ type: "text", text: string }` (single object format)
- The validation errors show "Expected object, received array" for content fields

## Specific Implementation Requirements

### 1. Update PromptMessage Interface

**File:** `src/prompts/PromptMessage.ts`

- Change `content` field from array format to single object format
- Update TypeScript interface to match MCP SDK specification exactly

### 2. Update PromptRenderer Implementation

**File:** `src/prompts/PromptRenderer.ts`

- Update `renderPrompt()` method at lines 27 and 35
- Change content assignments from array format to single object format
- Ensure both system and user messages use correct content structure

### 3. Technical Approach

**Step 1:** Fix PromptMessage Interface

```typescript
// Current (incorrect):
content: [{ type: "text"; text: string }]

// Change to (correct):
content: { type: "text", text: string }
```

**Step 2:** Update PromptRenderer

```typescript
// Current system message (line 27):
content: [{ type: "text", text: prompt.systemRules }]

// Change to:
content: { type: "text", text: prompt.systemRules }

// Current user message (line 35):
content: [{ type: "text", text: renderedTemplate }]

// Change to:
content: { type: "text", text: renderedTemplate }
```

## Detailed Acceptance Criteria

### Functional Requirements

- [ ] PromptMessage interface uses correct content format matching MCP SDK
- [ ] PromptRenderer creates messages with single content object (not array)
- [ ] Both system and user messages use consistent content structure
- [ ] No TypeScript compilation errors after changes
- [ ] All existing functionality preserved (no breaking changes)

### Testing Requirements

- [ ] Update existing unit tests for PromptMessage interface
- [ ] Update existing unit tests for PromptRenderer to expect correct format
- [ ] Verify PromptRenderer.test.ts passes with updated content format
- [ ] Add specific test case for MCP SDK compatibility validation
- [ ] Ensure all prompt-related tests pass after changes

### Integration Requirements

- [ ] MCP prompts/get endpoint returns correctly formatted messages
- [ ] No validation errors when using prompts with Claude Code slash commands
- [ ] Verify fix resolves the original validation error scenario

### Code Quality

- [ ] Follow existing TypeScript patterns in the codebase
- [ ] Maintain consistent code style with project standards
- [ ] Add JSDoc comments if interface signature changes significantly
- [ ] Run `npm run quality` and fix any linting/formatting issues

## Dependencies

**Prerequisites:** None - this is a standalone fix

**Blocked Tasks:** None

## Testing Strategy

1. **Unit Tests:** Update and verify all PromptMessage and PromptRenderer tests
2. **Integration Test:** Manually test with the failing prompt scenario provided
3. **Regression Test:** Ensure all existing prompt functionality still works

## Out of Scope

- Role support validation (explicitly excluded per requirements)
- Adding new content types or formats beyond single text object
- Performance optimizations or other enhancements
- Changes to prompt parsing or template rendering logic
- Updates to other MCP endpoint implementations

## Security Considerations

- Ensure content sanitization still works correctly with new format
- Verify no injection vulnerabilities introduced by format change
- Maintain input validation for rendered content

## Files to Modify

1. `src/prompts/PromptMessage.ts` - Interface definition
2. `src/prompts/PromptRenderer.ts` - Implementation updates
3. `src/prompts/__tests__/PromptRenderer.test.ts` - Test updates
4. `src/prompts/__tests__/PromptMessage.test.ts` - Test updates (if exists)

## Verification Steps

1. Run existing tests to confirm format changes work
2. Test with the original failing slash command scenario
3. Verify no MCP validation errors occur
4. Confirm all quality checks pass
