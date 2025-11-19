'use client';

import React from 'react';
import { HStack, SegmentGroup } from '@chakra-ui/react';
import { GiCaptainHatProfile } from 'react-icons/gi';
import { IoSettings } from 'react-icons/io5';
import { FaRegClosedCaptioning } from 'react-icons/fa';

export default function RoleSelectorSegmentGroup({ onChange, value = 'pilot', mobileOrientation = false }) {
  // onChange callback receives current selected value as string

  const handleValueChange = (details) => {
    if (onChange) {
      onChange(details.value);
    }
  };

  return (
    <SegmentGroup.Root
      value={value}
      size="sm"
      onValueChange={handleValueChange}
      style={{ marginBottom: 24 }}
      {...mobileOrientation ? { orientation: "vertical" } : {}}
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

