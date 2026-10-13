// Runs the Trust Trade Pro engine (engine.wasm — the iPhone app's own engine, compiled to WebAssembly) off the page's
// thread, so a long Auto-design never freezes the screen. Messages: {id, cmd, args} in, {id, result} or {id, error} out.

const dec = new TextDecoder(), enc = new TextEncoder();
let mem = null, ex = null;

// The few WASI calls the Swift runtime makes: no files, no arguments, a clock, random numbers and console output.
const BADF = 8, NOSYS = 52;
const view = () => new DataView(mem.buffer);
const wasi = {
  args_sizes_get(argc, size) { view().setUint32(argc, 0, true); view().setUint32(size, 0, true); return 0; },
  args_get() { return 0; },
  environ_sizes_get(count, size) { view().setUint32(count, 0, true); view().setUint32(size, 0, true); return 0; },
  environ_get() { return 0; },
  clock_res_get(id, out) { view().setBigUint64(out, 1000n, true); return 0; },
  clock_time_get(id, precision, out) {
    const ns = id === 0 ? BigInt(Date.now()) * 1000000n : BigInt(Math.round(performance.now() * 1e6));
    view().setBigUint64(out, ns, true);
    return 0;
  },
  fd_write(fd, iovs, count, written) {
    const v = view();
    let total = 0, text = '';
    for (let i = 0; i < count; i++) {
      const p = v.getUint32(iovs + 8 * i, true), n = v.getUint32(iovs + 8 * i + 4, true);
      text += dec.decode(new Uint8Array(mem.buffer, p, n));
      total += n;
    }
    v.setUint32(written, total, true);
    if (text.trim()) (fd === 2 ? console.warn : console.log)('[engine]', text.trimEnd());
    return 0;
  },
  fd_fdstat_get(fd, out) {
    if (fd > 2) return BADF;
    const v = view();
    v.setUint8(out, 2);                 // a character device
    v.setUint16(out + 2, 0, true);
    v.setBigUint64(out + 8, 0n, true);
    v.setBigUint64(out + 16, 0n, true);
    return 0;
  },
  fd_prestat_get() { return BADF; },    // no folders: the engine never touches files
  fd_prestat_dir_name() { return BADF; },
  random_get(buf, len) {
    for (let i = 0; i < len; i += 65536) crypto.getRandomValues(new Uint8Array(mem.buffer, buf + i, Math.min(65536, len - i)));
    return 0;
  },
  proc_exit(code) { throw new Error('The engine stopped (' + code + ')'); },
};

async function load() {
  // engine.wasm.gz: the engine gzipped (3.8 MB, not 14), unpacked here, so it arrives small whatever the host
  // compresses. If the host already unpacked it on the way, it's used as it comes.
  const res = await fetch(new URL('engine.wasm.gz?v=ffe7aa9-202610131146', self.location.href));
  if (!res.ok) throw new Error('The engine didn\'t download (' + res.status + ')');
  let bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }
  const module = await WebAssembly.compile(bytes);
  const imports = {};
  for (const imp of WebAssembly.Module.imports(module)) {
    if (imp.kind !== 'function') continue;
    imports[imp.module] ??= {};
    imports[imp.module][imp.name] = wasi[imp.name] ?? (imp.name.startsWith('fd_') ? () => BADF : () => NOSYS);
  }
  const instance = await WebAssembly.instantiate(module, imports);
  ex = instance.exports;
  mem = ex.memory;
  ex._initialize();
}

function call(cmd, args) {
  const bytes = enc.encode(JSON.stringify({ cmd, args }));
  const p = ex.tt_alloc(bytes.length);
  new Uint8Array(mem.buffer, p, bytes.length).set(bytes);
  const r = ex.tt_call(p, bytes.length);
  ex.tt_free(p);
  const len = new DataView(mem.buffer).getUint32(r, true);
  const text = dec.decode(new Uint8Array(mem.buffer, r + 4, len));
  ex.tt_free(r);
  return JSON.parse(text);
}

const ready = load();
self.onmessage = async (e) => {
  const { id, cmd, args } = e.data;
  try {
    await ready;
    const t0 = performance.now();
    const out = call(cmd, args);
    if (out && out.error) self.postMessage({ id, error: out.error, ms: performance.now() - t0 });
    else self.postMessage({ id, result: out, ms: performance.now() - t0 });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
