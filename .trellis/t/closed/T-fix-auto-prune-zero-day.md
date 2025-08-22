---
id: T-fix-auto-prune-zero-day
title: Fix auto-prune zero-day threshold to properly disable pruning
status: done
priority: high
prerequisites: []
affectedFiles:
  src/services/local/pruneClosed.ts:
    Added early return for age <= 0 with disabled
    message, preventing incorrect deletion behavior when auto-prune threshold is
    zero or negative
  src/services/local/__tests__/pruneClosed.test.ts: Updated tests to verify
    disabled behavior for zero and negative thresholds, ensuring no repository
    methods are called when auto-prune is disabled
log:
  - 'Fixed auto-prune zero-day threshold to properly disable pruning instead of
    deleting all objects. Added early return in pruneClosed function when age <=
    0, returning a "disabled" message without performing any object scanning or
    deletion. This prevents the bug where age=0 created a cutoff time of "now",
    causing all objects older than the current moment to be deleted. The fix
    provides double protection: server startup checks for autoPrune > 0, and the
    service function itself handles zero/negative values gracefully. All
    existing positive threshold behavior remains unchanged.'
schema: v1.0
childrenIds: []
created: 2025-08-22T19:29:40.969Z
updated: 2025-08-22T19:29:40.969Z
---

# Fix auto-prune zero-day threshold to properly disable pruning

## Context

Currently, when `--auto-prune 0` is specified, the system calculates a cutoff time of "now" and deletes objects older than the current moment, rather than disabling auto-pruning entirely. The expected behavior is that `0` should disable auto-pruning completely.

## Problem

In `src/services/local/pruneClosed.ts` line ~17:

```typescript
const cutoffTime = new Date(Date.now() - age * 24 * 60 * 60 * 1000);
```

When `age` is `0`, this creates `cutoffTime = new Date(Date.now())`, meaning anything with an `updated` timestamp before "right now" gets deleted. This is incorrect behavior.

The server startup code in `src/server.ts` already has the right check:

```typescript
if (serverConfig.autoPrune > 0) {
```

But the service function itself doesn't handle the zero case properly, and this affects direct service calls (like in E2E tests).

## Implementation Requirements

### Core Changes

1. **Add early return for zero threshold**:
   - In `pruneClosed.ts`, add check at the beginning: if `age <= 0`, return immediately with "disabled" message
   - This ensures consistent behavior whether called from server startup or directly

2. **Update return message**:
   - When `age <= 0`, return appropriate message indicating pruning was disabled
   - Message should clearly state "Auto-prune disabled (threshold: 0 days)"

3. **Update all calling code**:
   - Ensure server startup logic remains unchanged (already correct)
   - Verify E2E test helper functions handle disabled state properly

### Technical Approach

1. **Modify pruneClosed function**:

   ```typescript
   export async function pruneClosed(
     repository: Repository,
     age: number,
     scope?: string,
   ): Promise<{ content: Array<{ type: string; text: string }> }> {
     try {
       // Early return for disabled auto-prune
       if (age <= 0) {
         const message = scope
           ? `Auto-prune disabled (threshold: ${age} days) in scope ${scope}`
           : `Auto-prune disabled (threshold: ${age} days)`;

         return {
           content: [{ type: "text", text: message }]
         };
       }

       // Existing logic continues...
   ```

2. **Verify server startup behavior**:
   - Ensure `src/server.ts` continues to check `serverConfig.autoPrune > 0`
   - This provides double protection: server won't call service, and service returns early if called

3. **Update tests and documentation**:
   - Unit tests should verify zero/negative values return "disabled" message
   - E2E tests should be updated to reflect correct behavior
   - CLI help text should clearly state that 0 disables auto-prune

## Files to Modify

- `src/services/local/pruneClosed.ts` - Add early return for zero threshold
- `src/services/local/__tests__/pruneClosed.test.ts` - Update test expectations
- `src/__tests__/e2e/autoPrune.e2e.test.ts` - Update E2E test expectations

## Acceptance Criteria

- [ ] `pruneClosed(repository, 0)` returns "disabled" message without deleting anything
- [ ] `pruneClosed(repository, -1)` returns "disabled" message without deleting anything
- [ ] Server startup with `--auto-prune 0` doesn't call pruneClosed (existing behavior)
- [ ] Direct service calls with zero threshold don't delete any objects
- [ ] All existing positive threshold behavior remains unchanged
- [ ] Unit tests verify disabled behavior for zero and negative values
- [ ] E2E tests correctly expect "disabled" message for zero threshold
- [ ] Performance is optimal (immediate return, no object scanning)

## Dependencies

None - this is a standalone bug fix.

## Security Considerations

- Ensure zero threshold truly prevents all deletions
- Maintain audit trail by logging disabled state
- Prevent accidental data loss through proper validation

## Testing Requirements

Include unit tests covering:

- Zero threshold returns disabled message
- Negative threshold returns disabled message
- No objects are scanned or deleted when disabled
- Positive thresholds continue to work normally
- Scope parameter is included in disabled message when provided
