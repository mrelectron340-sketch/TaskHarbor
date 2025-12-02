# Contract Compilation Fixes

The contracts have type errors because Massa's Storage API works with strings, not bytes directly.

## Solution

We need to either:
1. Use a simpler storage pattern (store simple values as strings)
2. Convert serialized bytes to hex strings for storage
3. Use a different serialization approach

For now, I'll create a simplified version that stores data as serialized Args bytes converted to hex strings.

## Quick Fix

The main issue is that `Storage.set()` expects `string` but we're passing `StaticArray<u8>`. We need to convert bytes to hex strings for storage.

However, this is complex. A better approach is to simplify the contracts to use string-based storage for simple values and proper serialization only where needed.

Let me create a working version that compiles successfully.






