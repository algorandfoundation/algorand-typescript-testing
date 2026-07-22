import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(docsRoot, '..')
const examplesRoot = path.join(repoRoot, 'examples')
const outputDir = path.join(docsRoot, 'src', 'content', 'docs', 'examples')
const repoUrl = 'https://github.com/algorandfoundation/algorand-typescript-testing/blob/main'

type ExamplePage = {
  slug: string
  title: string
  summary: string
  sourcePath: string
  testPath: string | null
}

const ensureDir = (dir: string) => fs.mkdirSync(dir, { recursive: true })

const toTitle = (value: string) =>
  value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const isSpecFile = (name: string) => /\.(spec|test)\.ts$/.test(name)
const isAlgoSourceFile = (name: string) => name.endsWith('.algo.ts') && !isSpecFile(name)

const firstLeadingJsDoc = (content: string): string | null => {
  // Skip leading whitespace, shebang, // line comments, directives
  const trimmed = content.replace(/^﻿/, '')
  const match = trimmed.match(/^\s*(?:\/\/[^\n]*\n|\s+)*\/\*\*([\s\S]*?)\*\//)
  if (!match) return null
  const body = match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim()
  if (!body) return null
  // First paragraph, collapse whitespace
  return body.split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim() ?? null
}

const getMainModuleFile = (exampleDir: string): string | null => {
  const preferred = ['contract.algo.ts', 'signature.algo.ts']
  for (const name of preferred) {
    const candidate = path.join(exampleDir, name)
    if (fs.existsSync(candidate)) return candidate
  }

  const algoFiles = fs
    .readdirSync(exampleDir)
    .filter((name) => isAlgoSourceFile(name))
    .sort()

  if (algoFiles.length === 0) return null
  return path.join(exampleDir, algoFiles[0])
}

const getTestFile = (exampleDir: string): string | null => {
  const preferred = ['contract.algo.spec.ts', 'signature.algo.spec.ts']
  for (const name of preferred) {
    const candidate = path.join(exampleDir, name)
    if (fs.existsSync(candidate)) return candidate
  }

  const specFiles = fs
    .readdirSync(exampleDir)
    .filter((name) => /\.algo\.(spec|test)\.ts$/.test(name))
    .sort()

  if (specFiles.length === 0) return null
  return path.join(exampleDir, specFiles[0])
}

const buildExamplePages = (): ExamplePage[] => {
  if (!fs.existsSync(examplesRoot)) return []

  const dirs = fs
    .readdirSync(examplesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort()

  const pages: ExamplePage[] = []
  for (const dirName of dirs) {
    const exampleDir = path.join(examplesRoot, dirName)
    const moduleFile = getMainModuleFile(exampleDir)
    if (!moduleFile) continue

    const slug = dirName.replace(/_/g, '-')
    const title = toTitle(dirName)
    const sourcePath = path.relative(repoRoot, moduleFile).replace(/\\/g, '/')

    const testFile = getTestFile(exampleDir)
    const testPath = testFile ? path.relative(repoRoot, testFile).replace(/\\/g, '/') : null

    let summary = 'Example source and tests for this contract are available in the repository.'
    const docstring = firstLeadingJsDoc(fs.readFileSync(moduleFile, 'utf8'))
    if (docstring) summary = docstring

    pages.push({ slug, title, summary, sourcePath, testPath })
  }
  return pages
}

const renderExamplePage = (example: ExamplePage): string => {
  const testLink = example.testPath
    ? `- [Test file](${repoUrl}/${example.testPath})`
    : '- Test file not detected in this example directory.'

  return `---
title: ${example.title}
description: ${example.summary.replace(/"/g, '\\"')}
---

${example.summary}

## Repository links

- [Source file](${repoUrl}/${example.sourcePath})
${testLink}
`
}

const cleanOutput = () => {
  if (!fs.existsSync(outputDir)) return
  for (const entry of fs.readdirSync(outputDir)) {
    if (entry.startsWith('index.')) continue
    fs.rmSync(path.join(outputDir, entry), { recursive: true, force: true })
  }
}

const main = () => {
  ensureDir(outputDir)
  cleanOutput()

  const examples = buildExamplePages()

  for (const example of examples) {
    fs.writeFileSync(path.join(outputDir, `${example.slug}.mdx`), renderExamplePage(example))
  }

  console.log(`Generated ${examples.length} example page(s) in ${outputDir}`)
}

main()
