// Jobs live in this browser: the list and each job's project (the engine's own job file) in localStorage, plan
// images in IndexedDB (too big for localStorage). Nothing leaves the browser except a plan sent to be read.

const INDEX = 'ttpro.jobs', JOB = (id) => 'ttpro.job.' + id, BUSINESS = 'ttpro.business';

export function jobs() {
  try { return JSON.parse(localStorage.getItem(INDEX) || '[]'); } catch (_) { return []; }
}

function saveIndex(list) {
  try { localStorage.setItem(INDEX, JSON.stringify(list)); } catch (_) { /* full or blocked: the open job still works */ }
}

export function loadJob(id) {
  try {
    const raw = localStorage.getItem(JOB(id));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

/// Save a job's project, and its row in the list (name, customer, suburb, how far it's got, the system).
export function saveJob(id, project, summary) {
  try {
    localStorage.setItem(JOB(id), JSON.stringify(project));
  } catch (e) {
    return false;
  }
  const list = jobs().filter((j) => j.id !== id);
  list.unshift({ id, ...summary, updatedAt: Date.now() });
  saveIndex(list);
  return true;
}

export function deleteJob(id) {
  const job = loadJob(id);
  try { localStorage.removeItem(JOB(id)); } catch (_) {}
  saveIndex(jobs().filter((j) => j.id !== id));
  if (job?.backdrop?.file) deleteImage(job.backdrop.file);
}

export function business() {
  try { return JSON.parse(localStorage.getItem(BUSINESS) || '{}'); } catch (_) { return {}; }
}
export function saveBusiness(b) {
  try { localStorage.setItem(BUSINESS, JSON.stringify(b)); } catch (_) {}
}

// MARK: Plan images

let dbp = null;
function db() {
  dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open('ttpro', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('images');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}

export async function saveImage(name, blob) {
  try {
    const d = await db();
    await new Promise((resolve, reject) => {
      const t = d.transaction('images', 'readwrite');
      t.objectStore('images').put(blob, name);
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
    return true;
  } catch (_) { return false; }
}

export async function loadImage(name) {
  try {
    const d = await db();
    return await new Promise((resolve) => {
      const r = d.transaction('images').objectStore('images').get(name);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    });
  } catch (_) { return null; }
}

export async function deleteImage(name) {
  try {
    const d = await db();
    d.transaction('images', 'readwrite').objectStore('images').delete(name);
  } catch (_) {}
}
