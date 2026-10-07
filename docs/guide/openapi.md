# OpenAPI generation

Generate starter mock modules from an OpenAPI JSON or YAML document:

```bash
npx @agent-utils/mockserver generate ./openapi.yaml ./mocks
```

The command groups generated `.mock.ts` modules by the first path segment. Each module exports a registration function; import it in your mock setup and call it with the server instance.

Review the generated response bodies before committing them—the generator intentionally produces empty starter responses so you can tailor realistic data for your application.
