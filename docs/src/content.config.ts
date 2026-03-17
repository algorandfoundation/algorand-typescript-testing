import { defineCollection, z } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { examplesLoader } from './loaders/examples-loader'

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  examples: defineCollection({
    loader: examplesLoader(),
    schema: z.object({
      id: z.string().optional(),
      title: z.string(),
      description: z.string(),
      prerequisites: z.string(),
      code: z.string(),
      codeHtml: z.string(),
      order: z.number().int().nonnegative(),
      filename: z.string(),
      runCommand: z.string(),
      runCommandHtml: z.string(),
    }),
  }),
}
