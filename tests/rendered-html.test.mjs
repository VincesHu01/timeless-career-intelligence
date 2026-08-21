import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Timeless product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Timeless｜大厂产品与运营岗位能力雷达<\/title>/i);
  assert.match(html, /招聘市场不会给你答案/);
  assert.match(html, /趋势周报/);
  assert.match(html, /浏览真实样本/);
  assert.match(html, /数据诚实模式已开启/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("exports a deployable worker", async () => {
  const worker = await import(new URL("../dist/server/index.js", import.meta.url));
  assert.equal(typeof worker.default?.fetch, "function");
});
