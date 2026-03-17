// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc'
import remarkGithubAlerts from 'remark-github-alerts'

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
          },
        }),
      ],
      sidebar: [
        { label: 'Home', link: '/' },
        {
          label: 'Getting Started',
          items: [{ label: 'Quick Start', slug: 'tutorials/quick-start' }],
        },
        {
          label: 'Concepts (Core)',
          items: [
            { slug: 'concepts/core/testing-guide' },
            { slug: 'concepts/core/concepts' },
            { slug: 'concepts/core/avm-types' },
            { slug: 'concepts/core/arc4-types' },
            { slug: 'concepts/core/transactions' },
          ],
        },
        {
          label: 'Concepts (Building)',
          items: [
            { slug: 'concepts/building/application-spy' },
            { slug: 'concepts/building/contract-testing' },
            { slug: 'concepts/building/signature-testing' },
            { slug: 'concepts/building/state-management' },
          ],
        },
        {
          label: 'Concepts (Advanced)',
          items: [
            { slug: 'concepts/advanced/opcodes' },
            { slug: 'concepts/advanced/coverage' },
            { slug: 'concepts/advanced/faq' },
            { slug: 'concepts/advanced/algorand-typescript' },
          ],
        },
        {
          label: 'Examples',
          items: [{ label: 'Overview', link: '/examples/' }],
        },
        {
          label: 'Migration Guides',
          collapsed: true,
          autogenerate: { directory: 'migration' },
        },
        typeDocSidebarGroup,
      ],
    }),
  ],
})
