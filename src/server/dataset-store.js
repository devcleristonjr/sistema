export function createDatasetStore({ ttlMs }) {
  const items = new Map();

  function cleanup() {
    const now = Date.now();

    for (const [key, value] of items.entries()) {
      const updatedAt = value.updatedAt || value.createdAt || 0;
      if (now - updatedAt > ttlMs) {
        items.delete(key);
      }
    }
  }

  return {
    get(key) {
      cleanup();
      const value = items.get(key);
      if (!value) return null;
      value.updatedAt = Date.now();
      return value;
    },
    set(key, value) {
      cleanup();
      items.set(key, {
        ...value,
        updatedAt: Date.now()
      });
      return items.get(key);
    },
    delete(key) {
      items.delete(key);
    }
  };
}
