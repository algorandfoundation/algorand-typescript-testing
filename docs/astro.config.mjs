// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc'
import remarkGithubAlerts from 'remark-github-alerts'
import sidebarConfig from './sidebar.config.json'

// https://astro.build/config
export default defineConfig({
  site: 'https://algorandfoundation.github.io',
  base: '/algorand-typescript-testing/',
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [remarkGithubAlerts],
  },
  integrations: [
    starlight({
      title: 'Algorand TypeScript Testing',
      favicon: '/algokit_logo.png',
      expressiveCode: false,
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/algorandfoundation/algorand-typescript-testing' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/algorand' },
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: [
            '../src/index.ts',
            '../src/test-transformer/jest-transformer.ts',
            '../src/test-transformer/vitest-transformer.ts',
            '../src/value-generators/index.ts',
          ],
          tsconfig: '../tsconfig.build.json',
          output: 'api',
          sidebar: {
            label: 'API Reference',
            collapsed: true,
          },
          typeDoc: {
            excludeReferences: true,
            gitRevision: 'main',
            entryFileName: 'index',
          },
        }),
      ],
      sidebar: [...sidebarConfig, typeDocSidebarGroup],
    }),
  ],
})
