'use client';

import { Input, InputGroup, Field, Text, Box } from '@chakra-ui/react';
import { APPLICANT_CALLSIGN_RANGE } from '@/lib/callsign';

// The applicant's own callsign field. Deliberately separate from the crew login's
// CallsignInput: that one sits on a dark page and accepts whatever number a member
// was already given, while this one is light and refuses the reserved low numbers.
// Serving both from one component meant a prop for every difference.
//
// status: 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'error'
export default function ApplicantCallsignInput({ value, onChange, status = 'idle', label = 'Your callsign', ...rest }) {
    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
        onChange(digits);
    };

    const isAvailable = status === 'available';
    const isChecking = status === 'checking';
    const isTaken = status === 'taken';
    const isReserved = status === 'reserved';
    const isError = status === 'error';
    const isRejected = isTaken || isReserved;

    const borderColor = isRejected || isError ? 'red.500' : isAvailable ? 'green.500' : 'gray.300';
    const focusShadow = isRejected
        ? '0 0 0 3px rgba(229,62,62,0.4)'
        : isAvailable
            ? '0 0 0 3px rgba(72,187,120,0.4)'
            : '0 0 0 2px rgba(99,102,241,0.6)';

    return (
        <Field.Root invalid={isRejected || isError} mb={3}>
            <Field.Label color="gray.700">{label}</Field.Label>
            <InputGroup roundedLeft="sm" startAddon="INVA">
                <Input
                    value={value}
                    onChange={handleChange}
                    inputMode="numeric"
                    placeholder="136"
                    bg="white"
                    color="gray.900"
                    borderColor={borderColor}
                    borderWidth={isRejected ? '2px' : '1px'}
                    _focus={{ borderColor, boxShadow: focusShadow }}
                    fontFamily="mono"
                    letterSpacing="widest"
                    {...rest}
                />
            </InputGroup>

            {isRejected && (
                <Callout>
                    {isReserved
                        ? `INVA${value} is reserved for staff — pick a number between ${APPLICANT_CALLSIGN_RANGE}.`
                        : 'This callsign is already taken — please enter another number.'}
                </Callout>
            )}

            {isAvailable && (
                <Text color="green.600" fontSize="sm" mt={1} fontWeight="bold">
                    ✔ INVA{value} is available
                </Text>
            )}

            {isChecking && (
                <Text color="gray.500" fontSize="sm" mt={1}>
                    Checking availability…
                </Text>
            )}

            {isError && (
                <Text color="red.600" fontSize="sm" mt={1} fontWeight="bold">
                    Couldn&apos;t check this callsign — check your connection and try again.
                </Text>
            )}

            {status === 'idle' && (
                <Field.HelperText color="gray.500">
                    Enter a number between {APPLICANT_CALLSIGN_RANGE}
                </Field.HelperText>
            )}
        </Field.Root>
    );
}

// Pointer-topped red box used for the two "you can't have this one" answers.
function Callout({ children }) {
    return (
        <Box
            mt={2}
            px={3}
            py={2}
            bg="red.600"
            color="white"
            fontSize="sm"
            fontWeight="bold"
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
            ✖ {children}
        </Box>
    );
}
