import type { Loader } from 'astro/loaders'
import fs from 'node:fs'
import path from 'node:path'

type ExampleEntry = {
  id: string
  title: string
  description: string
  prerequisites: string
  code: string
  codeHtml: string
  order: number
  filename: string
  runCommand: string
  runCommandHtml: string
}

function lineSeparator(text: string, isBullet: boolean, lastWasBullet: boolean): string {
  if (!text) return ''
  if (isBullet || lastWasBullet) return '\n'
  return ' '
}

export function parseJSDoc(content: string): { title: string; description: string; prerequisites: string } {
  const jsdocMatch = content.match(/\/\*\*\n([\s\S]*?)\*\//)

  if (!jsdocMatch) {
    return { title: 'Example', description: '', prerequisites: '' }
  }

  const jsdocContent = jsdocMatch[1]

  const titleMatch = jsdocContent.match(/\*\s*Example:\s*(.+)/)
  const title = titleMatch?.[1]?.trim() || 'Example'

  const lines = jsdocContent.split('\n').map((line) => line.replace(/^\s*\*\s?/, '').trim())

  let description = ''
  let prerequisites = ''
  let inPrerequisites = false
  let lastLineWasBullet = false

  for (const line of lines) {
    if (line.startsWith('Example:')) continue

    if (line.toLowerCase().startsWith('prerequisites:') || line.toLowerCase() === 'prerequisites') {
      inPrerequisites = true
      lastLineWasBullet = false
      const prereqContent = line.replace(/prerequisites:?\s*/i, '').trim()
      if (prereqContent) prerequisites = prereqContent
      continue
    }

    if (line.startsWith('@')) continue

    if (!line) {
      lastLineWasBullet = false
      if (inPrerequisites) {
        if (prerequisites) prerequisites += '\n'
      } else if (description) {
        description += '\n'
      }
      continue
    }

    const isBullet = line.startsWith('-') || line.startsWith('•')
    if (inPrerequisites) {
      prerequisites += lineSeparator(prerequisites, isBullet, lastLineWasBullet) + line
    } else {
      description += lineSeparator(description, isBullet, lastLineWasBullet) + line
    }
    lastLineWasBullet = isBullet
  }

  return {
    title,
    description: description.trim(),
    prerequisites: prerequisites.trim() || 'LocalNet running (`algokit localnet start`)',
  }
}

export function extractOrder(filename: string): number {
  const match = filename.match(/^(\d+)-/)
  return match ? Number.parseInt(match[1], 10) : 999
}

export function createSlug(filename: string): string {
  return filename.replace(/\.algo\.ts$|\.ts$/, '').replace(/_/g, '-')
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function listExampleFiles(examplesDir: string): string[] {
  const found: string[] = []

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (entry.isFile() && entry.name.endsWith('.algo.ts') && !entry.name.startsWith('_')) {
        found.push(fullPath)
      }
    }
  }

  walk(examplesDir)
  return found
}

export function examplesLoader(): Loader {
  return {
    name: 'examples-loader',
    load: async ({ store, logger, renderMarkdown }) => {
      store.clear()

      const examplesDir = path.resolve(process.cwd(), '..', 'examples')

      logger.info(`Loading examples from ${examplesDir}`)

      if (!fs.existsSync(examplesDir)) {
        logger.error(`Examples directory not found: ${examplesDir}`)
        return
      }

      const entries: ExampleEntry[] = []
      const files = listExampleFiles(examplesDir)

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const relPath = path.relative(path.resolve(process.cwd(), '..'), filePath).replace(/\\/g, '/')
        const basename = path.basename(filePath)
        const defaultSlug = createSlug(relPath.replace(/^examples\//, '').replace(/\//g, '-'))
        const order = extractOrder(basename)
        const { title, description, prerequisites } = parseJSDoc(content)
        const codeLang = filePath.endsWith('.ts') ? 'typescript' : 'text'
        const renderedCode = await renderMarkdown(`\`\`\`${codeLang}\n${content}\n\`\`\``)
        const runCommand = 'npm run test'
        const renderedRunCommand = await renderMarkdown(`\`\`\`bash\n${runCommand}\n\`\`\``)

        const entry: ExampleEntry = {
          id: defaultSlug,
          title: title === 'Example' ? titleFromSlug(defaultSlug) : title,
          description: description || `Example source from \`${relPath}\`.`,
          prerequisites,
          code: content,
          codeHtml: renderedCode.html,
          order,
          filename: relPath,
          runCommand,
          runCommandHtml: renderedRunCommand.html,
        }

        entries.push(entry)
      }

      entries.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

      logger.info(`Found ${entries.length} examples`)

      for (const entry of entries) {
        store.set({
          id: entry.id,
          data: entry,
        })
      }
    },
  }
}

export type { ExampleEntry }
