import '@testing-library/jest-dom';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

if (typeof window !== 'undefined') {
  const local = window.localStorage;
  if (!local || typeof local.getItem !== 'function' || typeof local.clear !== 'function') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  }

  const session = window.sessionStorage;
  if (!session || typeof session.getItem !== 'function' || typeof session.clear !== 'function') {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  }
}
