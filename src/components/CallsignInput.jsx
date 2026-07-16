"use client";
import { Input, InputGroup, Field, Text, Box } from "@chakra-ui/react";
import { DarkMode } from "./ui/color-mode";

// status: 'idle' | 'checking' | 'available' | 'taken' | 'error'
// tone:   'dark' for the crew login's dark page, 'light' for the apply card.
export default function CallsignInput({ value, onChange, status = 'idle', label = 'Login', tone = 'dark', ...rest }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
    onChange(digits);
  };

  const isTaken     = status === 'taken';
  const isAvailable = status === 'available';
  const isChecking  = status === 'checking';
  const isError     = status === 'error';
  const isLight     = tone === 'light';

  const idleBorder = isLight ? 'gray.300' : 'gray.700';
  const borderColor = isTaken || isError ? 'red.500' : isAvailable ? 'green.500' : idleBorder;
  const borderWidth = isTaken ? '2px' : '1px';
  const focusShadow = isTaken
    ? '0 0 0 3px rgba(229,62,62,0.4)'
    : isAvailable
      ? '0 0 0 3px rgba(72,187,120,0.4)'
      : '0 0 0 2px rgba(99,102,241,0.6)';

  const mutedColor = isLight ? 'gray.500' : 'whiteAlpha.500';
  const successColor = isLight ? 'green.600' : 'green.400';
  const errorColor = isLight ? 'red.600' : 'red.400';

  const field = (
    <Field.Root invalid={isTaken || isError} mb={3}>
      <Field.Label color={isLight ? 'gray.700' : undefined}>{label}</Field.Label>
      <InputGroup roundedLeft="sm" startAddon="INVA" bgColor={isLight ? undefined : 'gray.900'} color="fg">
        <Input
          value={value}
          onChange={handleChange}
          inputMode="numeric"
          placeholder="136"
          borderColor={borderColor}
          borderWidth={borderWidth}
          _focus={{ borderColor, boxShadow: focusShadow }}
          fontFamily="mono"
          letterSpacing="widest"
          {...rest}
        />
      </InputGroup>

      {/* Error tooltip-style box */}
      {isTaken && (
        <Box
          mt={2}
          px={3}
          py={2}
          bg="red.600"
          color="white"
          fontSize="sm"
          fontWeight="medium"
          borderRadius="md"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: '-6px',
            left: '16px',
            borderWidth: '0 6px 6px 6px',
            borderStyle: 'solid',
            borderColor: 'transparent transparent var(--chakra-colors-red-600) transparent',
          }}
        >
          ✖ This callsign is already taken — please enter another number.
        </Box>
      )}

      {isAvailable && (
        <Text color={successColor} fontSize="sm" mt={1} fontWeight="medium">
          ✔ INVA{value} is available
        </Text>
      )}

      {isChecking && (
        <Text color={mutedColor} fontSize="sm" mt={1}>
          Checking availability…
        </Text>
      )}

      {isError && (
        <Text color={errorColor} fontSize="sm" mt={1} fontWeight="medium">
          Couldn’t check this callsign — check your connection and try again.
        </Text>
      )}

      {status === 'idle' && (
        <Field.HelperText color={mutedColor}>
          Enter a number between 100–999
        </Field.HelperText>
      )}
    </Field.Root>
  );

  return isLight ? field : <DarkMode>{field}</DarkMode>;
}
