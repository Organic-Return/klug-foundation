import { defineConfig } from 'sanity'
import { structureTool, type StructureBuilder } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { muxInput } from 'sanity-plugin-mux-input'
import { codeInput } from '@sanity/code-input'
import { assist } from '@sanity/assist'
import { schemaTypes } from './src/sanity/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Real Estate Website',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1zb39xqr',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S: StructureBuilder) =>
        S.list()
          .title('Content')
          .items([
            // Homepage singleton
            S.listItem()
              .title('Homepage')
              .icon(() => '🏠')
              .child(
                S.document()
                  .schemaType('homepage')
                  .documentId('homepage')
              ),
            // Settings singleton
            S.listItem()
              .title('Site Settings')
              .icon(() => '⚙️')
              .child(
                S.document()
                  .schemaType('settings')
                  .documentId('settings')
              ),
            // Buy Page singleton
            S.listItem()
              .title('Buy Page')
              .icon(() => '🏡')
              .child(
                S.document()
                  .schemaType('buyPage')
                  .documentId('buyPage')
              ),
            // Relocation Page singleton
            S.listItem()
              .title('Relocation Page')
              .icon(() => '🚚')
              .child(
                S.document()
                  .schemaType('relocationPage')
                  .documentId('relocationPage')
              ),
            // First Time Buyers Page singleton
            S.listItem()
              .title('First Time Buyers Page')
              .icon(() => '🔑')
              .child(
                S.document()
                  .schemaType('firstTimeBuyersPage')
                  .documentId('firstTimeBuyersPage')
              ),
            // Builders Page singleton
            S.listItem()
              .title('Builders Page')
              .icon(() => '🏗️')
              .child(
                S.document()
                  .schemaType('buildersPage')
                  .documentId('buildersPage')
              ),
            S.divider(),
            // All other document types
            ...S.documentTypeListItems().filter(
              (listItem) => !['settings', 'homepage', 'buyPage', 'relocationPage', 'firstTimeBuyersPage', 'buildersPage'].includes(listItem.getId() || '')
            ),
          ]),
    }),
    visionTool(),
    muxInput(),
    codeInput(),
    assist(),
  ],

  schema: {
    types: schemaTypes,
  },
})
