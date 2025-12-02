# Contract Storage Fixes

The Massa Storage API uses strings, not bytes. All contracts need to use `changetype` to convert between strings and bytes.

## Pattern to Apply:

**For Storage.set() with bytes:**
```typescript
// OLD:
Storage.set(key, bytes);

// NEW:
Storage.set(key, changetype<string>(bytes));
```

**For Storage.get() returning bytes:**
```typescript
// OLD:
const bytes = Storage.get(key);

// NEW:
const str = Storage.get(key);
const bytes = changetype<StaticArray<u8>>(str);
```

**For simple string values:**
```typescript
// OLD:
Storage.set(key, stringToBytes('0'));

// NEW:
Storage.set(key, '0');
```

## Files to Fix:
1. ✅ JobContract.ts - FIXED
2. ⏳ EscrowContract.ts - Need to fix
3. ⏳ VotingContract.ts - Need to fix  
4. ⏳ ProfileContract.ts - Need to fix






