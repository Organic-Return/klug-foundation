import { defineConfig } from 'sanity'
import { structureTool, type StructureBuilder } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { muxInput } from 'sanity-plugin-mux-input'
import { codeInput } from '@sanity/code-input'
import { assist } from '@sanity/assist'
import { media } from 'sanity-plugin-media'
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
            // Exclusive and New Page singleton
            S.listItem()
              .title('Exclusive and New Page')
              .icon(() => '✨')
              .child(
                S.document()
                  .schemaType('exclusiveAndNewPage')
                  .documentId('exclusiveAndNewPage')
              ),
            // Sold by Klug Properties Page singleton
            S.listItem()
              .title('Sold by Klug Properties Page')
              .icon(() => '🏷️')
              .child(
                S.document()
                  .schemaType('soldByKlugPage')
                  .documentId('soldByKlugPage')
              ),
            // Market Reports Page singleton
            S.listItem()
              .title('Market Reports Page')
              .icon(() => '📈')
              .child(
                S.document()
                  .schemaType('marketReportsPage')
                  .documentId('marketReportsPage')
              ),
            // Living Aspen Page singleton
            S.listItem()
              .title('Living Aspen Page')
              .icon(() => '📖')
              .child(
                S.document()
                  .schemaType('livingAspenPage')
                  .documentId('livingAspenPage')
              ),
            // Blog Page singleton
            S.listItem()
              .title('Blog Page')
              .icon(() => '📝')
              .child(
                S.document()
                  .schemaType('blogPage')
                  .documentId('blogPage')
              ),
            // In the News Page singleton
            S.listItem()
              .title('In the News Page')
              .icon(() => '📰')
              .child(
                S.document()
                  .schemaType('inTheNewsPage')
                  .documentId('inTheNewsPage')
              ),
            S.divider(),
            // All other document types
            ...S.documentTypeListItems().filter(
              (listItem) => !['settings', 'homepage', 'buyPage', 'relocationPage', 'firstTimeBuyersPage', 'buildersPage', 'exclusiveAndNewPage', 'soldByKlugPage', 'marketReportsPage', 'livingAspenPage', 'blogPage', 'inTheNewsPage'].includes(listItem.getId() || '')
            ),
          ]),
    }),
    visionTool(),
    muxInput(),
    codeInput(),
    assist(),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },
})
