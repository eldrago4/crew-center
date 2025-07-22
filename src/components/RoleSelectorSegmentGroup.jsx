'use client';

import React from 'react';
import { HStack, SegmentGroup } from '@chakra-ui/react';
import { GiCaptainHatProfile } from 'react-icons/gi';
import { IoSettings } from 'react-icons/io5';

export default function RoleSelectorSegmentGroup({ onChange, defaultValue = 'pilot' }) {
  // onChange callback receives current selected value as string

  const handleValueChange = (details) => {
    if (onChange) {
      onChange(details.value);
    }
  };

  return (
    <SegmentGroup.Root
      defaultValue={defaultValue}
      size="sm"
      onValueChange={handleValueChange}
      style={{ marginTop: 16, marginBottom: 24 }}
    >
      <SegmentGroup.Indicator />
      <SegmentGroup.Items
        items={[
          {
            value: 'pilot',
            label: (
              <HStack spacing={2}>
                <GiCaptainHatProfile />
                Pilot
              </HStack>
            ),
          },
          {
            value: 'admin',
            label: (
              <HStack spacing={2}>
                <IoSettings />
                Admin
              </HStack>
            ),
          },
        ]}
      />
    </SegmentGroup.Root>
  );
}

