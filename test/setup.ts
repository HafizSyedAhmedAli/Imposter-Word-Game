// test/setup.ts
//
// Runs before every test file (see vitest.config.ts's `setupFiles`).
//
// - `fake-indexeddb/auto` installs an in-memory IndexedDB implementation
//   on the global object, since jsdom itself does not implement
//   IndexedDB. This is what lets lib/db.ts's `getDb()` construct a real
//   Dexie database against isolated, in-memory storage during tests --
//   never the developer's actual browser database.
// - sessionStorage/localStorage are provided by jsdom already; we just
//   make sure every test starts from a clean slate so tests can't leak
//   state into one another regardless of run order.
import "fake-indexeddb/auto";
import { afterEach, beforeEach } from "vitest";

function resetWebStorage() {
  window.sessionStorage.clear();
  window.localStorage.clear();
}

beforeEach(() => {
  resetWebStorage();
});

afterEach(() => {
  resetWebStorage();
});
