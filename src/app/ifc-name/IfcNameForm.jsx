"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    Heading,
    Input,
    Button,
    Field,
    Fieldset,
    Stack,
    Alert, // Keep Alert for potential other uses, or remove if not needed elsewhere
    Center,
    Text,
    Dialog,
    VStack
} from "@chakra-ui/react";
import { FiAlertCircle } from 'react-icons/fi';

// IfcNameForm now accepts onSubmitAction as a prop
export default function IfcNameForm({ onSubmitAction }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [ ifcName, setIfcName ] = useState("");
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState("");
    const [ isErrorDialogOpen, setIsErrorDialogOpen ] = useState(false);
    const [ isSuccessDialogOpen, setIsSuccessDialogOpen ] = useState(false);
    const leastDestructiveRef = useRef(null);

    const id = searchParams.get("callsign") || "";
    const discordId = searchParams.get("discordId") || "";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsErrorDialogOpen(false);
        setIsSuccessDialogOpen(false);

        if (!ifcName.trim()) {
            setError("IFC Name is required");
            setIsErrorDialogOpen(true);
            return;
        }
        setLoading(true);
        try {
            // Call the server action passed as a prop
            const result = await onSubmitAction({ id, discordId, ifcName: ifcName.trim() });

            if (result.error) {
                setError(result.error);
                setIsErrorDialogOpen(true);
            } else { // result.success is true
                setIsSuccessDialogOpen(true);
                setTimeout(() => {
                    setIsSuccessDialogOpen(false);
                    router.push("/crew/dashboard");
                }, 3000); // 4 seconds delay
            }
        } catch (err) {
            // This catch block handles errors thrown by the server action itself
            // or network issues preventing the server action from being called.
            setError("An unexpected error occurred: " + err.message);
            setIsErrorDialogOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Center minH="100vh">
            <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" minW="350px" bg="white">
                <Heading size="lg" mb={6} textAlign="center">Enter Your IFC Name</Heading>
                <form onSubmit={handleSubmit}>
                    <Fieldset.Root size="lg" maxW="md">
                        <Stack spacing={4} align="stretch">
                            <Fieldset.Legend>IFC Registration</Fieldset.Legend>
                            <Fieldset.HelperText>
                                Please provide your Infinite Flight Community name below.
                            </Fieldset.HelperText>
                        </Stack>
                        <Fieldset.Content>
                            <Field.Root required invalid={!!error && isErrorDialogOpen}>
                                <Field.Label htmlFor="ifcName">IFC Name</Field.Label>
                                <Input
                                    id="ifcName"
                                    value={ifcName}
                                    onChange={e => setIfcName(e.target.value)}
                                    placeholder="Infinite Flight Community Name"
                                    autoFocus
                                />
                                {error && !isErrorDialogOpen && (
                                    <Field.ErrorText>{error}</Field.ErrorText>
                                )}
                            </Field.Root>
                        </Fieldset.Content>
                        <Button
                            type="submit"
                            colorScheme="purple"
                            isLoading={loading}
                            loadingText="Submitting"
                            isDisabled={loading}
                            alignSelf="flex-start"
                        >
                            Submit
                        </Button>
                        
                        {/* Error Dialog Component */}
                        <Dialog.Root
                            open={isErrorDialogOpen}
                            onOpenChange={(details) => setIsErrorDialogOpen(details.open)}
                            role="alertdialog"
                            leastDestructiveRef={leastDestructiveRef}
                        >
                            <Dialog.Backdrop />
                            <Dialog.Positioner>
                                <Dialog.Content borderRadius="lg" shadow="xl" maxW="md">
                                    <Dialog.Header borderBottomWidth="1px" pb={3}>
                                        <Heading size="md" color="red.500">Registration Error</Heading>
                                    </Dialog.Header>
                                    <Dialog.CloseTrigger ref={leastDestructiveRef} />
                                    
                                    <Dialog.Body py={4}>
                                        <VStack spacing={3} align="start">
                                            <Box color="red.600">
                                                <FiAlertCircle size={20} />
                                            </Box>
                                            <Text fontSize="sm">{error}</Text>
                                        </VStack>
                                    </Dialog.Body>
                                    
                                    <Dialog.Footer borderTopWidth="1px" pt={3}>
                                        <Button 
                                            colorScheme="red" 
                                            onClick={() => setIsErrorDialogOpen(false)}
                                            ref={leastDestructiveRef}
                                        >
                                            Close
                                        </Button>
                                    </Dialog.Footer>
                                </Dialog.Content>
                            </Dialog.Positioner>
                        </Dialog.Root>

                        {/* Success Dialog Component */}
                        <Dialog.Root
                            open={isSuccessDialogOpen}
                            onOpenChange={(details) => setIsSuccessDialogOpen(details.open)}
                            role="alertdialog"
                        >
                            <Dialog.Backdrop />
                            <Dialog.Positioner>
                                <Dialog.Content borderRadius="lg" shadow="xl" maxW="md">
                                    <Dialog.Header borderBottomWidth="1px" pb={3}>
                                        <Heading size="md" color="green.500">Registration Successful!</Heading>
                                    </Dialog.Header>
                                    
                                    <Dialog.Body py={4}>
                                        <VStack spacing={3} align="start">
                                            <Box color="green.600">
                                                <FiAlertCircle size={20} />
                                            </Box>
                                            <Text fontSize="sm">Your IFC Name has been registered successfully. Redirecting to dashboard in 4 seconds...</Text>
                                        </VStack>
                                    </Dialog.Body>
                                    
                                    <Dialog.Footer borderTopWidth="1px" pt={3}>
                                        <Text fontSize="xs" color="gray.500">Please wait...</Text>
                                    </Dialog.Footer>
                                </Dialog.Content>
                            </Dialog.Positioner>
                        </Dialog.Root>
                    </Fieldset.Root>
                </form>
            </Box>
        </Center>
    );
}
