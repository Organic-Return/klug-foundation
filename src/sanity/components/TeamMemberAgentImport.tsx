'use client'

import { useCallback, useState } from 'react'
import { Box, Button, Card, Flex, Stack, Text, TextInput, Spinner, Badge, useToast } from '@sanity/ui'
import type { StringInputProps } from 'sanity'
import { set, useClient, useFormValue } from 'sanity'
import { SearchIcon, CheckmarkCircleIcon } from '@sanity/icons'

interface AgentSearchResult {
  agentStaffId: string
  databaseId: string
  firstName: string
  lastName: string
  office: string
  photoUrl: string | null
}

interface AgentFullData extends AgentSearchResult {
  bio: string
  email: string
  businessPhone: string
  mobilePhone: string
  officePhone: string
  officeName: string
  officeAddress: string
  mlsNumbers: string[]
  specialty: string
}

export function TeamMemberAgentImport(props: StringInputProps) {
  const { onChange, value } = props
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AgentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [importedAgent, setImportedAgent] = useState<AgentFullData | null>(null)

  const sanityClient = useClient({ apiVersion: '2024-01-01' })
  const documentId = useFormValue(['_id']) as string | undefined
  const toast = useToast()

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setHasSearched(true)
    try {
      const response = await fetch(
        `/api/agents?list=true&search=${encodeURIComponent(searchQuery.trim())}`
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.agents || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Failed to search agents:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  // Upload photo from external URL to Sanity asset pipeline
  const uploadPhotoToSanity = useCallback(
    async (photoUrl: string) => {
      try {
        // Fetch via our proxy to avoid CORS
        const proxyResponse = await fetch(
          `/api/agents/photo?url=${encodeURIComponent(photoUrl)}`
        )
        if (!proxyResponse.ok) return null

        const blob = await proxyResponse.blob()
        const contentType = blob.type || 'image/jpeg'
        const ext = contentType.includes('png') ? 'png' : 'jpg'

        const asset = await sanityClient.assets.upload('image', blob, {
          filename: `agent-photo.${ext}`,
          contentType,
        })

        return {
          _type: 'image' as const,
          asset: {
            _type: 'reference' as const,
            _ref: asset._id,
          },
        }
      } catch (error) {
        console.error('Failed to upload photo:', error)
        return null
      }
    },
    [sanityClient]
  )

  // Select an agent and import all data into the team member document
  const handleSelect = useCallback(
    async (agent: AgentSearchResult) => {
      if (!documentId) {
        toast.push({
          status: 'error',
          title: 'Please save the document first, then try importing again.',
        })
        return
      }

      setImporting(true)

      try {
        // Fetch full agent data using unique database ID
        const response = await fetch(
          `/api/agents?agentStaffId=${encodeURIComponent(agent.agentStaffId)}&databaseId=${encodeURIComponent(agent.databaseId)}&full=true`
        )
        if (!response.ok) throw new Error('Failed to fetch agent details')
        const fullData: AgentFullData = await response.json()

        // Build patch — only include non-empty values
        const patchData: Record<string, unknown> = {}

        const name = `${fullData.firstName} ${fullData.lastName}`
        if (name.trim()) patchData.name = name

        if (fullData.bio) patchData.bio = fullData.bio
        if (fullData.email) patchData.email = fullData.email
        if (fullData.businessPhone) patchData.phone = fullData.businessPhone
        if (fullData.mobilePhone) patchData.mobile = fullData.mobilePhone
        if (fullData.officePhone) patchData.office = fullData.officePhone
        if (fullData.officeAddress) patchData.address = fullData.officeAddress
        if (fullData.specialty) patchData.title = fullData.specialty

        if (fullData.mlsNumbers && fullData.mlsNumbers.length > 0) {
          patchData.mlsAgentId = fullData.mlsNumbers[0]
        }

        // Set sync tracking fields
        patchData.realogyId = agent.agentStaffId
        patchData.syncSource = 'manual'

        // Upload photo if available
        if (fullData.photoUrl) {
          const imageData = await uploadPhotoToSanity(fullData.photoUrl)
          if (imageData) {
            patchData.image = imageData
          }
        }

        // Patch the draft document using a transaction to ensure draft exists
        const rawId = documentId.replace(/^drafts\./, '')
        const draftId = `drafts.${rawId}`
        await sanityClient
          .transaction()
          .createIfNotExists({ _id: draftId, _type: 'teamMember' })
          .patch(draftId, { set: patchData })
          .commit()

        // Set the sirAgentId field
        onChange(set(agent.agentStaffId))

        setImportedAgent(fullData)
        setSearchResults([])

        toast.push({
          status: 'success',
          title: 'Agent data imported successfully',
          description: `Imported data for ${fullData.firstName} ${fullData.lastName}`,
        })
      } catch (error) {
        console.error('Failed to import agent data:', error)
        toast.push({
          status: 'error',
          title: 'Failed to import agent data',
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        setImporting(false)
      }
    },
    [documentId, sanityClient, onChange, uploadPhotoToSanity, toast]
  )

  const handleClear = useCallback(() => {
    setImportedAgent(null)
    setSearchResults([])
    setSearchQuery('')
    setHasSearched(false)
    onChange(set(''))
  }, [onChange])

  return (
    <Stack space={4}>
      <Card padding={4} border radius={2} tone="primary">
        <Stack space={4}>
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              Import from SIR Database
            </Text>
            <Badge tone="primary" fontSize={0}>Optional</Badge>
          </Flex>
          <Text size={1} muted>
            Search the Sotheby&apos;s International Realty database to auto-populate
            fields. All imported fields can be edited afterward.
          </Text>

          <Flex gap={2}>
            <Box flex={1}>
              <TextInput
                placeholder="Search by agent name or office..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={importing}
              />
            </Box>
            <Button
              icon={SearchIcon}
              text="Search"
              tone="primary"
              onClick={handleSearch}
              disabled={loading || importing || !searchQuery.trim()}
            />
          </Flex>

          {loading && (
            <Flex align="center" gap={3} padding={3}>
              <Spinner />
              <Text>Searching agents...</Text>
            </Flex>
          )}

          {importing && (
            <Flex align="center" gap={3} padding={3}>
              <Spinner />
              <Text>Importing agent data and uploading photo...</Text>
            </Flex>
          )}

          {!loading && !importing && hasSearched && searchResults.length === 0 && (
            <Card padding={3} tone="caution" border radius={2}>
              <Text size={1}>No agents found. Try a different search term.</Text>
            </Card>
          )}

          {!loading && !importing && searchResults.length > 0 && (
            <Stack space={2}>
              <Text size={1} muted>
                Found {searchResults.length} agent{searchResults.length !== 1 ? 's' : ''}.
                Click to import data:
              </Text>
              <Card border radius={2} style={{ maxHeight: '300px', overflow: 'auto' }}>
                <Stack>
                  {searchResults.map((agent) => (
                    <Card
                      key={agent.agentStaffId}
                      as="button"
                      padding={3}
                      onClick={() => handleSelect(agent)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--card-border-color)',
                      }}
                    >
                      <Flex align="center" gap={3}>
                        {agent.photoUrl && (
                          <Box
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={agent.photoUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                        )}
                        <Stack space={1}>
                          <Text size={2} weight="semibold">
                            {agent.firstName} {agent.lastName}
                          </Text>
                          {agent.office && (
                            <Text size={1} muted>{agent.office}</Text>
                          )}
                          <Text size={0} muted>ID: {agent.agentStaffId}</Text>
                        </Stack>
                      </Flex>
                    </Card>
                  ))}
                </Stack>
              </Card>
            </Stack>
          )}

          {importedAgent && (
            <Card padding={3} tone="positive" border radius={2}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Text size={0}><CheckmarkCircleIcon /></Text>
                  <Text size={2} weight="semibold">
                    Imported: {importedAgent.firstName} {importedAgent.lastName}
                  </Text>
                </Flex>
                <Text size={1} muted>
                  Fields populated: name
                  {importedAgent.bio ? ', bio' : ''}
                  {importedAgent.email ? ', email' : ''}
                  {importedAgent.businessPhone ? ', phone' : ''}
                  {importedAgent.mobilePhone ? ', mobile' : ''}
                  {importedAgent.officePhone ? ', office phone' : ''}
                  {importedAgent.officeAddress ? ', address' : ''}
                  {importedAgent.mlsNumbers?.length ? ', MLS ID' : ''}
                  {importedAgent.photoUrl ? ', photo' : ''}
                </Text>
                <Text size={1} muted>
                  You can edit any of the imported fields below.
                </Text>
                <Button
                  text="Clear Import"
                  mode="ghost"
                  tone="critical"
                  onClick={handleClear}
                />
              </Stack>
            </Card>
          )}

          {value && !importedAgent && (
            <Card padding={3} tone="transparent" border radius={2}>
              <Text size={1} muted>
                Previously imported SIR Agent ID: {value}
              </Text>
            </Card>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
