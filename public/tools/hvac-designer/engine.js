// The page's side of the engine: every call goes to the worker (engine-worker.js) and comes back as a promise.

const worker = new Worker(new URL('./engine-worker.js?v=8589d9f-202610131323', import.meta.url));
const pending = new Map();
let nextId = 1;

worker.onmessage = (e) => {
  const { id, result, error } = e.data;
  const p = pending.get(id);
  if (!p) return;
  pending.delete(id);
  if (error) p.reject(new Error(error));
  else p.resolve(result);
};
worker.onerror = (e) => {
  for (const p of pending.values()) p.reject(new Error(e.message || 'The engine failed to load'));
  pending.clear();
};

export function call(cmd, args = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, cmd, args });
  });
}

/// For calls made on every frame of a drag: one at a time, and only the newest waiting one runs next — the screen
/// gets every answer it can keep up with, never a queue of stale ones.
export function latest() {
  let busy = false, waiting = null;
  async function run(cmd, args, onResult) {
    if (busy) { waiting = { cmd, args, onResult }; return; }
    busy = true;
    try {
      onResult(await call(cmd, args));
    } catch (_) {
      // A drag's in-between answer that failed is just skipped.
    } finally {
      busy = false;
      if (waiting) {
        const w = waiting;
        waiting = null;
        run(w.cmd, w.args, w.onResult);
      }
    }
  }
  return run;
}
