'use client'

import { useCallback, useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Box, Button, Card, Flex, Stack, Text, useToast } from '@sanity/ui'
import { UploadIcon } from '@sanity/icons'
import type { ArrayOfObjectsInputProps } from 'sanity'
import { insert, setIfMissing, useClient } from 'sanity'
import { randomKey } from '@sanity/util/content'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
const CONCURRENCY = 3

/**
 * Wraps the default array-of-images input with a drop zone that accepts many
 * photos at once. Each file is uploaded to the Sanity asset pipeline and then
 * appended to the array as a normal image item, so hotspot, caption, reorder
 * and delete all keep working through the stock input rendered below.
 */
export function MultiImageUpload(props: ArrayOfObjectsInputProps) {
  const { onChange, renderDefault, readOnly } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(
        (f) => ACCEPTED_TYPES.includes(f.type) || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name)
      )
      const skipped = fileList.length - files.length
      if (skipped > 0) {
        toast.push({
          status: 'warning',
          title: `Skipped ${skipped} file${skipped === 1 ? '' : 's'} that ${skipped === 1 ? 'is' : 'are'} not an image`,
        })
      }
      if (files.length === 0) return

      setProgress({ done: 0, total: files.length })
      let done = 0
      let failed = 0

      // Upload in small parallel batches, but append to the array in the
      // original selection order so the gallery matches what the editor picked.
      const results: Array<{ _key: string; _type: 'image'; asset: { _type: 'reference'; _ref: string } } | null> =
        new Array(files.length).fill(null)

      let next = 0
      const worker = async () => {
        while (next < files.length) {
          const index = next++
          const file = files[index]
          try {
            const asset = await client.assets.upload('image', file, {
              filename: file.name,
              contentType: file.type || undefined,
            })
            results[index] = {
              _key: randomKey(12),
              _type: 'image',
              asset: { _type: 'reference', _ref: asset._id },
            }
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error)
            failed++
          } finally {
            done++
            setProgress({ done, total: files.length })
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker))

      const items = results.filter((r): r is NonNullable<typeof r> => r !== null)
      if (items.length > 0) {
        onChange([setIfMissing([]), insert(items, 'after', [-1])])
      }

      setProgress(null)
      toast.push({
        status: failed > 0 ? 'warning' : 'success',
        title:
          failed > 0
            ? `Added ${items.length} photo${items.length === 1 ? '' : 's'}, ${failed} failed`
            : `Added ${items.length} photo${items.length === 1 ? '' : 's'}`,
      })
    },
    [client, onChange, toast]
  )

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setDragging(false)
      if (readOnly || progress) return
      if (event.dataTransfer.files.length > 0) uploadFiles(event.dataTransfer.files)
    },
    [readOnly, progress, uploadFiles]
  )

  const onDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!dragging) setDragging(true)
    },
    [dragging]
  )

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
  }, [])

  const onPick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) uploadFiles(event.target.files)
      // Reset so picking the same files again still fires onChange
      event.target.value = ''
    },
    [uploadFiles]
  )

  const busy = progress !== null

  return (
    <Stack space={3}>
      <Card
        padding={4}
        radius={2}
        border
        tone={dragging ? 'primary' : 'default'}
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          opacity: readOnly ? 0.6 : 1,
          transition: 'background-color 120ms',
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
      >
        <Flex align="center" justify="center" direction="column" gap={3}>
          <Text size={1} muted align="center">
            {busy
              ? `Uploading ${progress.done} of ${progress.total} photos…`
              : 'Drag and drop photos here, or'}
          </Text>
          {!busy && (
            <Button
              icon={UploadIcon}
              text="Select photos"
              mode="ghost"
              tone="primary"
              disabled={readOnly}
              onClick={() => inputRef.current?.click()}
            />
          )}
          {busy && (
            <Box style={{ width: '100%', maxWidth: 320 }}>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'var(--card-border-color)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round((progress.done / progress.total) * 100)}%`,
                    background: 'var(--card-focus-ring-color)',
                    transition: 'width 200ms',
                  }}
                />
              </div>
            </Box>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={readOnly || busy}
            onChange={onPick}
          />
        </Flex>
      </Card>

      {renderDefault(props)}
    </Stack>
  )
}
