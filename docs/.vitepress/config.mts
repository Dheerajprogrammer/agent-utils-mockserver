import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Mockserver",
  description: "Switch between mock and real APIs without changing application code.",
  base: "/agent-utils-mockserver/",
  cleanUrls: true,
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/mock-server" },
      { text: "npm", link: "https://www.npmjs.com/package/@agent-utils/mockserver" }
    ],
    sidebar: {
      "/guide/": [
        { text: "Guide", items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Modes", link: "/guide/modes" },
          { text: "Browser apps", link: "/guide/browser" },
          { text: "Node.js and tests", link: "/guide/node" },
          { text: "OpenAPI generation", link: "/guide/openapi" }
        ] }
      ],
      "/api/": [
        { text: "Reference", items: [
          { text: "Mock server", link: "/api/mock-server" },
          { text: "Routes and resources", link: "/api/routes-and-resources" }
        ] }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/Dheerajprogrammer/agent-utils-mockserver" }
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Dheerajprogrammer"
    },
    editLink: {
      pattern: "https://github.com/Dheerajprogrammer/agent-utils-mockserver/edit/main/docs/:path",
      text: "Edit this page on GitHub"
    }
  }
});
