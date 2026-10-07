#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import YAML from "yaml";

type Spec = { paths?: Record<string, Record<string, unknown>> };
function routeName(path: string) { return path.split("/").filter(Boolean).find(x => !x.startsWith("{"))?.replace(/[^a-zA-Z0-9]/g, "-") || "api"; }
async function generate(file: string, out = "mocks") {
  const raw = await readFile(file, "utf8"); const spec = (extname(file).match(/ya?ml/) ? YAML.parse(raw) : JSON.parse(raw)) as Spec;
  await mkdir(out, { recursive: true }); const grouped = new Map<string, string[]>();
  for (const [path, operations] of Object.entries(spec.paths ?? {})) for (const method of Object.keys(operations)) {
    if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
    const name = routeName(path); const lines = grouped.get(name) ?? [];
    lines.push(`mock.${method}("${path.replace(/\{([^}]+)\}/g, ":$1")}", () => ({ status: 200, body: {} }));`); grouped.set(name, lines);
  }
  await Promise.all([...grouped].map(([name, lines]) => writeFile(join(out, `${name}.mock.ts`), `import type { MockApi } from "easymockapi";\n\nexport default function register(mock: MockApi) {\n  ${lines.join("\n  ")}\n}\n`)));
  console.log(`Generated ${grouped.size} mock module(s) in ${out}`);
}
const [, , command, input, output] = process.argv;
if (command === "generate" && input) generate(input, output).catch(error => { console.error(error.message); process.exitCode = 1; });
else console.error(`Usage: ${basename(process.argv[1] ?? "easymockapi")} generate <openapi.json|yaml> [output-dir]`);
