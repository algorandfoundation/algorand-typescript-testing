/**
 * Generates static .mdx files from example .ts files for devportal inclusion.
 *
 * Reuses parsing helpers from the examples-loader.
 * Output goes to src/content/docs/examples/ so it gets packaged in the tarball.
 *
 * Run: npx tsx docs/scripts/generate-examples-mdx.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import { parseJSDoc, extractOrder, createSlug } from '../src/loaders/examples-loader.ts'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')
const EXAMPLES_DIR = path.join(REPO_ROOT, 'examples')
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs', 'src', 'content', 'docs', 'examples')
const GITHUB_BASE = 'https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/examples'

// Clean output directory
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true })
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// Collect all examples
type ExampleInfo = { title: string; slug: string; description: string; filename: string; relativePath: string }
const allExamples: ExampleInfo[] = []
let totalCount = 0

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => {
      if (part.toLowerCase() === 'abi') return 'ABI'
      if (part.toLowerCase() === 'arc4') return 'ARC4'
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' ')
}

function listExampleFiles(root: string): string[] {
  const files: string[] = []

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (!entry.isFile()) continue
      if (entry.name.startsWith('_')) continue
      if (!entry.name.endsWith('.algo.ts')) continue
      if (entry.name.endsWith('.spec.ts')) continue
      files.push(fullPath)
    }
  }

  walk(root)
  return files
}

const files = listExampleFiles(EXAMPLES_DIR)

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(EXAMPLES_DIR, filePath).replace(/\\/g, '/')
  const filename = path.basename(filePath)
  const { title, description, prerequisites } = parseJSDoc(content)
  const order = extractOrder(filename)
  const slug = createSlug(relativePath.replace(/\//g, '-'))
  const resolvedTitle = title === 'Example' ? titleFromSlug(slug) : title
  const resolvedDescription = description.trim() || `Example source from \`examples/${relativePath}\`.`
  const githubUrl = `${GITHUB_BASE}/${relativePath}`
  const runCommand = `npx tsx ${relativePath}`

  const prereqText = prerequisites || 'LocalNet running (`algokit localnet start`)'

  allExamples.push({ title: resolvedTitle, slug, description: resolvedDescription, filename, relativePath })

  const mdx = `---
title: "${resolvedTitle}"
description: "${resolvedDescription.split('\n')[0].replace(/"/g, '\\"')}"
sidebar:
  order: ${order}
---

[← Back to Examples](../)

## Description

${resolvedDescription.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')}

## Prerequisites

${prereqText}

## Run This Example

From the repository's \`examples\` directory:

\`\`\`bash
cd examples
${runCommand}
\`\`\`

## Code

[View source on GitHub](${githubUrl})

\`\`\`typescript title="${relativePath}"
${content}
\`\`\`

---

### Other examples

PLACEHOLDER_OTHER_EXAMPLES
`

  fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.mdx`), mdx)
  totalCount++
}

// Second pass: replace placeholder with actual sibling links
for (const example of allExamples) {
  const filePath = path.join(OUTPUT_DIR, `${example.slug}.mdx`)
  let content = fs.readFileSync(filePath, 'utf-8')

  const siblingLinks = allExamples
    .map((ex) => (ex.slug === example.slug ? `- **${ex.title}**` : `- [${ex.title}](../${ex.slug}/)`))
    .join('\n')

  content = content.replace('PLACEHOLDER_OTHER_EXAMPLES', siblingLinks)
  fs.writeFileSync(filePath, content)
}

// Generate flat index.mdx with HTML table
const escapeForMdx = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')

const tableRows = allExamples
  .map((ex) => {
    const lines = ex.description.split('\n')
    let descHtml = ''
    let bulletBuffer: string[] = []
    const flushBullets = () => {
      if (bulletBuffer.length > 0) {
        descHtml += '<ul>' + bulletBuffer.map((b) => `<li>${escapeForMdx(b)}</li>`).join('') + '</ul>'
        bulletBuffer = []
      }
    }
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (/^[-•]\s/.test(trimmed)) {
        bulletBuffer.push(trimmed.replace(/^[-•]\s*/, ''))
      } else {
        flushBullets()
        descHtml += `<p>${escapeForMdx(trimmed)}</p>`
      }
    }
    flushBullets()

    return `<tr><td><a href="${ex.slug}/">${escapeForMdx(ex.title)}</a></td><td>${descHtml}</td></tr>`
  })
  .join('\n')

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'index.mdx'),
  `---
title: Code Examples
description: "${totalCount} runnable TypeScript examples demonstrating Algorand TypeScript testing features"
sidebar:
  order: 0
---

Browse **${totalCount}** runnable TypeScript examples demonstrating the Algorand TypeScript testing library. Each example is self-contained and demonstrates specific functionality.

## Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/algorandfoundation/algorand-typescript-testing.git
cd algorand-typescript-testing

# Install dependencies
npm install

# Run any example
cd examples
npx tsx hello-world/contract.algo.ts
\`\`\`

## Prerequisites

- Node.js >= 20
- npm

## Examples (${totalCount})

<table>
<thead><tr><th>Example</th><th>Description</th></tr></thead>
<tbody>
${tableRows}
</tbody>
</table>

<style>
{\`
table {
  width: 100%;
  border-collapse: collapse;
}
table th, table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--sl-color-gray-5);
}
table td p {
  margin: 0.25rem 0;
}
table td ul {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
}
\`}
</style>
`,
)

console.log(`Generated ${totalCount} example MDX files + index page in docs/src/content/docs/examples/`)
