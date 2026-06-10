'use client';

import React from 'react';
import { SegmentGroup } from '@chakra-ui/react';
import { GiCaptainHatProfile } from 'react-icons/gi';
import { IoSettings } from 'react-icons/io5';

const ITEMS = [
  { value: 'pilot', label: 'Pilot', Icon: GiCaptainHatProfile },
  { value: 'admin', label: 'Admin', Icon: IoSettings },
];

export default function RoleSelectorSegmentGroup({ onChange, value = 'pilot' }) {
  // onChange callback receives the current selected value as a string.
  const handleValueChange = (details) => {
    if (onChange) {
      onChange(details.value);
    }
  };

  return (
    // Horizontal pill/tab toggle: both options always visible side by side in
    // one connected container. Active tab = light translucent gray indicator
    // (darker text); inactive tab = dimmed gray. Neutral — no gold.
    <SegmentGroup.Root
      value={value}
      size="md"
      onValueChange={handleValueChange}
      id="role-selector-segment-group"
      bg="transparent"
      borderWidth="1px"
      borderColor="gray.500"
      _dark={{ borderColor: 'whiteAlpha.500' }}
      borderRadius="2xl"
      p="1"
    >
      <SegmentGroup.Indicator
        bg="rgba(148,163,184,0.22)"
        borderWidth="1px"
        borderColor="gray.400"
        borderRadius="xl"
        _dark={{ bg: 'rgba(255,255,255,0.16)', borderColor: 'whiteAlpha.500' }}
      />
      {ITEMS.map(({ value: itemValue, label, Icon }) => (
        <SegmentGroup.Item
          key={itemValue}
          value={itemValue}
          flex="1"
          position="relative"
          zIndex={1}
          justifyContent="center"
          borderRadius="xl"
          fontWeight="semibold"
          color="gray.600"
          _dark={{ color: 'gray.300' }}
          _checked={{ color: 'gray.800', _dark: { color: 'white' } }}
          cursor="pointer"
        >
          <SegmentGroup.ItemText display="inline-flex" alignItems="center" gap="2">
            <Icon />
            {label}
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}
