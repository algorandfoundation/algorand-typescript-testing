// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightTypeDoc from 'starlight-typedoc'
import remarkGithubAlerts from 'remark-github-alerts'
import remarkFixIndexUrls from './plugins/remark-fix-index-urls'
import sidebar from './sidebar.config.json'

// https://astro.build/config
export default defineConfig({
  site: 'https://algorandfoundation.github.io',
  base: '/algorand-typescript-testing/',
  trailingSlash: 'always',
  redirects: {
    '/testing-guide/': '/algorand-typescript-testing/concepts/overview/',
    '/testing-guide/concepts/': '/algorand-typescript-testing/concepts/overview/',
    '/testing-guide/avm-types/': '/algorand-typescript-testing/concepts/avm-types/',
    '/testing-guide/arc4-types/': '/algorand-typescript-testing/concepts/arc4-types/',
    '/testing-guide/opcodes/': '/algorand-typescript-testing/concepts/opcodes/',
    '/testing-guide/application-spy/': '/algorand-typescript-testing/guide/application-spy/',
    '/testing-guide/contract-testing/': '/algorand-typescript-testing/guide/contract-testing/',
    '/testing-guide/signature-testing/': '/algorand-typescript-testing/guide/signature-testing/',
    '/testing-guide/state-management/': '/algorand-typescript-testing/guide/state-management/',
    '/testing-guide/transactions/': '/algorand-typescript-testing/guide/transactions/',
    '/coverage/': '/algorand-typescript-testing/reference/coverage/',
    '/faq/': '/algorand-typescript-testing/reference/faq/',
    '/algots/': '/algorand-typescript-testing/concepts/algots/',
  },
  markdown: {
    remarkPlugins: [remarkGithubAlerts, remarkFixIndexUrls],
  },
  integrations: [
    starlight({
      title: 'Algorand TypeScript Testing',
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      customCss: [
        'remark-github-alerts/styles/github-colors-light.css',
        'remark-github-alerts/styles/github-colors-dark-media.css',
        'remark-github-alerts/styles/github-base.css',
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/algorandfoundation/algorand-typescript-testing',
        },
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
          tsconfig: '../tsconfig.json',
          output: 'api',
          sidebar: {
            label: 'API Reference',
            collapsed: true,
          },
          typeDoc: {
            excludeReferences: true,
            excludeInternal: true,
            excludePrivate: true,
            excludeProtected: true,
            excludeExternals: true,
            gitRevision: 'main',
            entryFileName: 'index',
          },
        }),
      ],
      sidebar,
    }),
  ],
})
