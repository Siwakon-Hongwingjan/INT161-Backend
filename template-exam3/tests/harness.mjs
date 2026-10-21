// Zero-dependency test harness (Node 18+). Used by tests/test-runner.mjs
const C = { r: "\x1b[0m", g: "\x1b[32m", R: "\x1b[31m", y: "\x1b[33m", b: "\x1b[1m", d: "\x1b[90m" };
export const studentId = process.argv[2] || "67130500001";
export const base = `http://localhost:${process.argv[3] || 3000}`;
export const api = `${base}/api/${studentId}`;

export async function call(method, path, body) {
  const res = await fetch(api + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, data: json?.data };
}
export const get = (p) => call("GET", p);
export const post = (p, b) => call("POST", p, b);
export const put = (p, b) => call("PUT", p, b);
export const patch = (p, b) => call("PATCH", p, b);
export const del = (p) => call("DELETE", p);

export function assert(cond, msg) { if (!cond) throw new Error(msg); }
export function eq(actual, expected, what) {
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
export function status(res, expected, what = "") {
  assert(res.status === expected, `${what} expected HTTP ${expected}, got ${res.status}`.trim());
}
export function keys(obj, expected, what) {
  eq(Object.keys(obj || {}).sort(), [...expected].sort(), `${what} keys`);
}
export function errorEnvelope(res) {
  assert(res.json?.success === false && res.json?.error?.code && res.json?.error?.message,
    `error body must be {success:false, error:{code,message}}, got ${JSON.stringify(res.json)}`);
}

const results = [];
export async function test(category, name, points, fn) {
  process.stdout.write(`  • [${category}] ${name} ... `);
  try {
    await fn();
    results.push({ category, name, points, max: points });
    console.log(`${C.g}PASSED${C.r} (${points}/${points})`);
  } catch (e) {
    results.push({ category, name, points: 0, max: points, error: e.message });
    console.log(`${C.R}FAILED${C.r} (0/${points})\n    ${C.R}↳ ${e.message}${C.r}`);
  }
}
export async function start(title) {
  console.log(`\n${C.b}=== ${title} ===${C.r}\nTarget: ${api}`);
  try { await fetch(`${api}/student-info`, { signal: AbortSignal.timeout(3000) }); }
  catch { console.log(`${C.R}Cannot reach ${base} - run "npm start" first${C.r}`); process.exit(1); }
}
export function summary() {
  const total = results.reduce((a, r) => a + r.points, 0);
  const max = results.reduce((a, r) => a + r.max, 0);
  console.log("\n" + "-".repeat(50));
  for (const cat of [...new Set(results.map((r) => r.category))]) {
    const rs = results.filter((r) => r.category === cat);
    console.log(`  ${cat.padEnd(24)} ${rs.reduce((a, r) => a + r.points, 0)}/${rs.reduce((a, r) => a + r.max, 0)}`);
  }
  console.log("-".repeat(50));
  console.log(`${C.b}TOTAL: ${total} / ${max}${C.r}\n`);
  process.exitCode = total === max ? 0 : 1;
}
