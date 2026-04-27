"use client";

import { Textarea, Button, Field, Stack } from "@chakra-ui/react";
import { useState } from "react";

export default function DatabaseViewer({ initialModuleData, moduleName, redis = false }) {
    const [moduleData, setModuleData] = useState(() =>
        JSON.stringify(initialModuleData, null, 2)
    );
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            let newValue;
            try {
                // Parse the JSON string
                newValue = JSON.parse(moduleData);
            } catch (parseError) {
                alert("Error: The content in the text area is not valid JSON. Please ensure it's a correctly formatted JSON array or object.");
                console.error("Invalid JSON in textarea:", parseError);
                setIsUpdating(false);
                return;
            }

            const apiEndpoint = redis ? "/api/crewcenter/ceo" : "/api/crewcenter";
            console.log(`Sending update request to: ${apiEndpoint}`);

            const requestBody = JSON.stringify({ moduleName, newValue });

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody,
            });

            if (response.ok) {
                alert("Module data updated successfully!");
            } else {
                const errorData = await response.json();
                alert(`Failed to update module data: ${errorData.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Failed to update module data:", error);
            alert("An unexpected error occurred during the update process. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Stack spacing={4}>
            <Field.Root>
                <Field.Label>{moduleName} module</Field.Label>
                <Textarea
                    value={moduleData}
                    onChange={(e) => setModuleData(e.target.value)}
                    placeholder={`Loading ${moduleName} module data...`}
                    disabled={isUpdating}
                    minH="300px"
                />
            </Field.Root>
            <Button
                onClick={handleUpdate}
                isLoading={isUpdating}
                loadingText="Updating..."
                disabled={isUpdating}
                alignSelf="flex-start"
            >
                Update {moduleName}
            </Button>
        </Stack>
    );
}