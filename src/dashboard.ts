import { createServer, type Server } from "node:http";
import type { MockApi } from "./core.js";
import type { DashboardOptions } from "./types.js";

const page = `<!doctype html><title>EasyMockAPI</title><style>body{font:14px system-ui;margin:2rem;color:#18212f}table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{padding:.6rem;border-bottom:1px solid #ddd;text-align:left}button{padding:.45rem .7rem}</style><h1>EasyMockAPI dashboard</h1><p><button id="toggle">Toggle mocks</button> <span id="state"></span></p><h2>Routes</h2><table><thead><tr><th>Method</th><th>Path</th><th>Hits</th></tr></thead><tbody id="routes"></tbody></table><h2>Recent requests</h2><table><thead><tr><th>Time</th><th>Request</th><th>Status</th></tr></thead><tbody id="requests"></tbody></table><script>async function load(){let d=await fetch('/__easymockapi/state').then(r=>r.json());state.textContent=d.enabled?'Enabled':'Disabled';routes.innerHTML=d.routes.map(r=>'<tr><td>'+r.method+'</td><td>'+r.path+'</td><td>'+r.hits+'</td></tr>').join('');requests.innerHTML=d.requests.map(r=>'<tr><td>'+r.at+'</td><td>'+r.method+' '+r.path+'</td><td>'+r.status+'</td></tr>').join('')}toggle.onclick=async()=>{await fetch('/__easymockapi/toggle',{method:'POST'});load()};load();setInterval(load,1500)</script>`;
export function startDashboard(api: MockApi, options: DashboardOptions = {}) {
  const server: Server = createServer((req, res) => {
    if (req.url === "/__easymockapi/state") { res.setHeader("content-type", "application/json"); return res.end(JSON.stringify({ enabled: api.isEnabled(), routes: api.routes, requests: api.requests })); }
    if (req.url === "/__easymockapi/toggle" && req.method === "POST") { api.toggle(); return res.end(); }
    res.setHeader("content-type", "text/html; charset=utf-8"); res.end(page);
  });
  server.listen(options.port ?? 4000, options.host ?? "127.0.0.1"); return server;
}
