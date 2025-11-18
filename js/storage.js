// storage.js

export function storageGet(key) {
  return new Promise((resolve) =>
    chrome.storage.local.get(key, (res) => resolve(res))
  );
}

export function storageSet(obj) {
  return new Promise((resolve) =>
    chrome.storage.local.set(obj, () => resolve())
  );
}

export function storageClear() {
  return new Promise((resolve) =>
    chrome.storage.local.clear(() => resolve())
  );
}
