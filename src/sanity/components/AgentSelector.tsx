'use client'

import { useCallback, useState } from 'react'
import { Box, Button, Card, Flex, Stack, Text, TextInput, Spinner } from '@sanity/ui'
import type { StringInputProps } from 'sanity'
import { set, useFormValue } from 'sanity'
import { SearchIcon } from '@sanity/icons'

interface Agent {
  agentStaffId: string
  firstName: string
  lastName: string
  office: string
  photoUrl: string | null
}

export function AgentSelector(props: StringInputProps) {
  const { onChange, value } = props
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  // Get the current document values
  const firstName = useFormValue(['firstName']) as string | undefined
  const lastName = useFormValue(['lastName']) as string | undefined

  // Search for agents
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/agents?list=true&search=${encodeURIComponent(searchQuery.trim())}`)
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

  // Handle enter key in search input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  // Select an agent
  const handleSelect = useCallback((agent: Agent) => {
    setSelectedAgent(agent)
    onChange(set(agent.agentStaffId))
  }, [onChange])

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedAgent(null)
    setSearchResults([])
    setSearchQuery('')
    setHasSearched(false)
    onChange(set(''))
  }, [onChange])

  return (
    <Stack space={4}>
      <Card padding={4} border radius={2}>
        <Stack space={4}>
          <Text size={1} weight="semibold">Search for an Agent</Text>
          <Text size={1} muted>
            Enter agent name or office location and click Search.
          </Text>

          <Flex gap={2}>
            <Box flex={1}>
              <TextInput
                placeholder="Search by name or office..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
              />
            </Box>
            <Button
              icon={SearchIcon}
              text="Search"
              tone="primary"
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
            />
          </Flex>

          {/* Loading state */}
          {loading && (
            <Flex align="center" gap={3} padding={3}>
              <Spinner />
              <Text>Searching agents...</Text>
            </Flex>
          )}

          {/* Search results */}
          {!loading && hasSearched && searchResults.length === 0 && (
            <Card padding={3} tone="caution" border radius={2}>
              <Text size={1}>No agents found. Try a different search term.</Text>
            </Card>
          )}

          {!loading && searchResults.length > 0 && (
            <Stack space={2}>
              <Text size={1} muted>
                Found {searchResults.length} agent{searchResults.length !== 1 ? 's' : ''}. Click to select:
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
                      tone={selectedAgent?.agentStaffId === agent.agentStaffId ? 'positive' : 'default'}
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
                            <Text size={1} muted>
                              {agent.office}
                            </Text>
                          )}
                          <Text size={0} muted>
                            ID: {agent.agentStaffId}
                          </Text>
                        </Stack>
                      </Flex>
                    </Card>
                  ))}
                </Stack>
              </Card>
            </Stack>
          )}

          {/* Selected agent display */}
          {selectedAgent && (
            <Card padding={3} tone="positive" border radius={2}>
              <Stack space={3}>
                <Flex align="center" gap={3}>
                  {selectedAgent.photoUrl && (
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={selectedAgent.photoUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  <Stack space={1}>
                    <Text size={2} weight="semibold">
                      Selected: {selectedAgent.firstName} {selectedAgent.lastName}
                    </Text>
                    {selectedAgent.office && (
                      <Text size={1} muted>
                        {selectedAgent.office}
                      </Text>
                    )}
                    <Text size={1} muted>
                      Staff ID: {selectedAgent.agentStaffId}
                    </Text>
                  </Stack>
                </Flex>
                <Button
                  text="Clear Selection"
                  mode="ghost"
                  tone="critical"
                  onClick={handleClear}
                />
              </Stack>
            </Card>
          )}

          {/* Reminder to fill name fields */}
          {selectedAgent && (!firstName || !lastName || firstName !== selectedAgent.firstName || lastName !== selectedAgent.lastName) && (
            <Card padding={3} tone="caution" border radius={2}>
              <Stack space={2}>
                <Text size={1} weight="semibold">Please enter these values in the name fields below:</Text>
                <Text size={1}>First Name: <strong>{selectedAgent.firstName}</strong></Text>
                <Text size={1}>Last Name: <strong>{selectedAgent.lastName}</strong></Text>
              </Stack>
            </Card>
          )}

          {/* Show current value if set but no selected agent (e.g., editing existing record) */}
          {value && !selectedAgent && firstName && lastName && (
            <Card padding={3} tone="transparent" border radius={2}>
              <Stack space={2}>
                <Text size={1} muted>Current agent:</Text>
                <Text size={2} weight="semibold">{firstName} {lastName}</Text>
                <Text size={1} muted>Staff ID: {value}</Text>
              </Stack>
            </Card>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
