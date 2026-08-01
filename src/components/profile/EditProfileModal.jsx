'use client'

import { useState } from 'react'
import {
  Dialog, Portal, Box, Stack, Text, Input, Textarea, Select,
  Button, createListCollection, Field,
} from '@chakra-ui/react'
import { AIRCRAFT, getAirlineById } from '@/data/fleet'

const MAX_DISPLAY_NAME = 30
const MAX_BIO = 280

const aircraftOptions = createListCollection({
  items: [
    { value: '', label: 'None' },
    ...AIRCRAFT.map((a) => ({ value: a.id, label: `${a.type} · ${getAirlineById(a.airline)?.name ?? ''}` })),
  ],
})

export default function EditProfileModal({ initial, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [bio, setBio] = useState(initial.bio)
  const [favAircraft, setFavAircraft] = useState(initial.favAircraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, favAircraft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(e) => !e.open && onClose()} placement="center" size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="gray.900" borderColor="gray.700" borderWidth="1px">
            <Dialog.Header>
              <Dialog.Title color="white">Edit profile</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              <Stack gap={5}>
                <Field.Root>
                  <Field.Label color="gray.300">Display name</Field.Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, MAX_DISPLAY_NAME))}
                    placeholder="Shown instead of your IFC name"
                    bg="gray.800" borderColor="gray.600" color="white"
                  />
                  <Box fontSize="xs" color="gray.500" textAlign="right" mt={1}>{displayName.length}/{MAX_DISPLAY_NAME}</Box>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="gray.300">Bio</Field.Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                    placeholder="Only shown publicly if you set one"
                    rows={4}
                    bg="gray.800" borderColor="gray.600" color="white"
                  />
                  <Box fontSize="xs" color="gray.500" textAlign="right" mt={1}>{bio.length}/{MAX_BIO}</Box>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="gray.300">Favourite aircraft</Field.Label>
                  <Select.Root
                    collection={aircraftOptions}
                    value={[favAircraft]}
                    onValueChange={(e) => setFavAircraft(e.value[0])}
                    size="md" variant="outline" w="full"
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger bg="gray.800" borderColor="gray.600" color="white">
                        <Select.ValueText placeholder="None" />
                      </Select.Trigger>
                      <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content bg="gray.800" borderColor="gray.600" maxH="260px" overflowY="auto">
                          {aircraftOptions.items.map((item) => (
                            <Select.Item item={item} key={item.value} color="gray.300">
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                {error && <Text color="red.400" fontSize="sm">{error}</Text>}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" color="gray.400" onClick={onClose} mr={3}>Cancel</Button>
              <Button colorPalette="yellow" onClick={save} loading={saving}>Save</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
