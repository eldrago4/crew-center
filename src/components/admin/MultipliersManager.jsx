"use client";

import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Card,
    Stack,
    Input,
    Heading,
    IconButton,
    Badge
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCorners
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import {
    CSS
} from "@dnd-kit/utilities";
import { toaster } from "@/components/ui/toaster";
import {
    Plus,
    Trash2,
    Edit,
    Save,
    X,
    GripVertical,
    ArrowUpDown,
    ChevronUp,
    ChevronDown
} from "lucide-react";

// Icon components similar to AdminPirepsTable pattern
const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

function SortableMultiplierCard({
    multiplier,
    index,
    isEditing,
    onStartEdit,
    onSave,
    onCancelEdit,
    onDelete,
    onUpdate
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: multiplier.id,
        data: {
            type: 'multiplier',
            multiplier,
            index
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card.Root
            ref={setNodeRef}
            style={style}
            p={4}
            borderWidth={isDragging ? 2 : 1}
            borderColor={isDragging ? "blue.400" : "border"}
            bg={isDragging ? "blue.50" : "bg.default"}
            shadow={isDragging ? "lg" : "sm"}
            _hover={{ shadow: "md" }}
            transition="all 0.2s"
            {...attributes}
        >
            <HStack justify="space-between" align="start">
                <HStack spacing={3} flex={1}>
                    <VStack spacing={1} align="center">
                        <IconButton
                            size="sm"
                            variant="ghost"
                            {...listeners}
                            cursor={isDragging ? "grabbing" : "grab"}
                            _hover={{ bg: "bg.muted" }}
                            ariaLabel="Drag to reorder"
                        >
                            <GripVertical width={16} height={16} fill="currentColor" />
                        </IconButton>
                        <Badge variant="outline" fontSize="xs">
                            {index + 1}
                        </Badge>
                    </VStack>

                    <Stack spacing={2} flex={1}>
                        {isEditing ? (
                            <VStack spacing={3} align="stretch">
                                <Box>
                                    <Text fontSize="sm" fontWeight="medium" mb={1}>Label</Text>
                                    <Input
                                        size="sm"
                                        value={multiplier.label}
                                        onChange={(e) => onUpdate(multiplier.id, "label", e.target.value)}
                                        placeholder="Multiplier label"
                                        autoFocus
                                    />
                                </Box>

                                <HStack spacing={4}>
                                    <Box flex={1}>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Value</Text>
                                        <Input
                                            size="sm"
                                            type="number"
                                            value={multiplier.value}
                                            onChange={(e) => onUpdate(multiplier.id, "value", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            min={0}
                                            step={1}
                                            max={999}
                                        />
                                    </Box>

                                    <Box flex={2}>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Description</Text>
                                        <Input
                                            size="sm"
                                            value={multiplier.description}
                                            onChange={(e) => onUpdate(multiplier.id, "description", e.target.value)}
                                            placeholder="Description"
                                        />
                                    </Box>
                                </HStack>
                            </VStack>
                        ) : (
                            <VStack spacing={1} align="stretch">
                                <HStack spacing={2}>
                                    <Text fontWeight="bold" fontSize="lg" color="fg">
                                        {multiplier.label}
                                    </Text>
                                    <Badge colorPalette="blue" variant="solid">
                                        {multiplier.value}x
                                    </Badge>
                                </HStack>

                                <Text fontSize="sm" color="fg.muted">
                                    {multiplier.description || "No description"}
                                </Text>
                            </VStack>
                        )}
                    </Stack>
                </HStack>

                <HStack spacing={2}>
                    {isEditing ? (
                        <>
                            <IconButton
                                size="sm"
                                colorPalette="green"
                                onClick={() => onSave(multiplier.id)}
                                ariaLabel="Save multiplier"
                            >
                                <Save width={16} height={16} />
                            </IconButton>
                            <IconButton
                                size="sm"
                                variant="outline"
                                onClick={onCancelEdit}
                                ariaLabel="Cancel editing"
                            >
                                <X width={16} height={16} fill="currentColor" />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <IconButton
                                size="sm"
                                variant="outline"
                                onClick={() => onStartEdit(multiplier.id)}
                                ariaLabel="Edit multiplier"
                            >
                                <Edit width={16} height={16} />
                            </IconButton>
                            <IconButton
                                size="sm"
                                colorPalette="red"
                                variant="outline"
                                onClick={() => onDelete(multiplier.id)}
                                ariaLabel="Delete multiplier"
                            >
                                <Trash2 width={16} height={16}/>
                            </IconButton>
                        </>
                    )}
                </HStack>
            </HStack>
        </Card.Root>
    );
}

export default function MultipliersManager({ initialModuleData, moduleName }) {
    const [ multipliers, setMultipliers ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ editingId, setEditingId ] = useState(null);
    const [ isAdding, setIsAdding ] = useState(false);
    const [ activeId, setActiveId ] = useState(null);
    const [ tempMultiplier, setTempMultiplier ] = useState({
        label: "",
        value: 1,
        description: ""
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize multipliers from initial data
    useEffect(() => {
        if (initialModuleData && Array.isArray(initialModuleData)) {
            const multipliersWithIds = initialModuleData.map((multiplier, index) => ({
                ...multiplier,
                id: multiplier.id || `multiplier-${index}-${Date.now()}`,
            }));
            setMultipliers(multipliersWithIds);
        }
    }, [ initialModuleData ]);

    const validateMultiplier = (multiplier) => {
        if (!multiplier.label || multiplier.label.trim() === "") {
            toaster.create({
                title: "Validation Error",
                description: "Label is required",
                type: "error"
            });
            return false;
        }

        const value = multiplier.value === "" ? 0 : Number(multiplier.value);
        if (isNaN(value) || value < 0) {
            toaster.create({
                title: "Validation Error",
                description: "Value must be a positive number",
                type: "error"
            });
            return false;
        }

        // Check for duplicate labels (excluding current item)
        const isDuplicate = multipliers.some(item =>
            item.label.toLowerCase() === multiplier.label.toLowerCase() &&
            item.id !== multiplier.id
        );

        if (isDuplicate) {
            toaster.create({
                title: "Validation Error",
                description: "A multiplier with this label already exists",
                type: "error"
            });
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const apiEndpoint = "/api/crewcenter";
            const multipliersToSave = multipliers.map(({ id, ...rest }) => rest); // Remove temporary IDs
            const requestBody = JSON.stringify({
                moduleName: "multipliers",
                newValue: multipliersToSave
            });

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody,
            });

            if (response.ok) {
                toaster.create({
                    title: "Success",
                    description: "Multipliers updated successfully!",
                    type: "success"
                });
            } else {
                const errorData = await response.json();
                toaster.create({
                    title: "Update Failed",
                    description: errorData.error || "Unknown error occurred",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Failed to update multipliers:", error);
            toaster.create({
                title: "Error",
                description: "An unexpected error occurred during the update process",
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addMultiplier = () => {
        if (!validateMultiplier(tempMultiplier)) {
            return;
        }

        const newMultiplier = {
            ...tempMultiplier,
            id: `multiplier-${Date.now()}`
        };

        setMultipliers([ ...multipliers, newMultiplier ]);
        setTempMultiplier({ label: "", value: 1, description: "" });
        setIsAdding(false);

        toaster.create({
            title: "Added",
            description: "New multiplier added successfully",
            type: "success"
        });
    };

    const cancelAdd = () => {
        setTempMultiplier({ label: "", value: 1, description: "" });
        setIsAdding(false);
    };

    const updateMultiplier = (id, field, value) => {
        setMultipliers(multipliers.map(item =>
            item.id === id ? { ...item, [ field ]: value } : item
        ));
    };

    const deleteMultiplier = (id) => {
        setMultipliers(multipliers.filter(item => item.id !== id));
        toaster.create({
            title: "Deleted",
            description: "Multiplier removed successfully",
            type: "info"
        });
    };

    const startEditing = (id) => {
        setEditingId(id);
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const saveMultiplier = (id) => {
        const multiplier = multipliers.find(item => item.id === id);
        if (validateMultiplier(multiplier)) {
            setEditingId(null);
            toaster.create({
                title: "Saved",
                description: "Multiplier updated successfully",
                type: "success"
            });
        }
    };

    // Drag and Drop Handlers
    function handleDragStart(event) {
        const { active } = event;
        setActiveId(active.id);
    }

    function handleDragEnd(event) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setMultipliers((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);

                const newOrder = arrayMove(items, oldIndex, newIndex);

                toaster.create({
                    title: "Reordered",
                    description: `Multiplier moved to position ${newIndex + 1}`,
                    type: "info"
                });

                return newOrder;
            });
        }

        setActiveId(null);
    }

    const activeMultiplier = multipliers.find(item => item.id === activeId);

    return (
        <Box>
            {/* Header */}
            <VStack spacing={4} mb={6}>
                <HStack justify="space-between" w="full" align="center">
                    <VStack align="start" spacing={0}>
                        <Heading size="lg" color="fg">
                            Flight Multipliers
                        </Heading>
                        <Text fontSize="sm" color="fg.muted">
                            Manage and reorder flight multipliers by dragging cards
                        </Text>
                    </VStack>

                    <HStack spacing={3}>
                        <Button
                            leftIcon={<Plus width={16} height={16} fill="currentColor" />}
                            onClick={() => {
                                setTempMultiplier({ label: "", value: 1, description: "" });
                                setIsAdding(true);
                            }}
                            colorPalette="blue"
                        >
                            Add Multiplier
                        </Button>
                        <Button
                            leftIcon={<ArrowUpDown />}
                            onClick={handleSave}
                            isLoading={isLoading}
                            loadingText="Saving..."
                            variant="outline"
                        >
                            Save Changes
                        </Button>
                    </HStack>
                </HStack>

                <Box borderTop="1px" borderColor="border" />

                {/* Add Form */}
                {isAdding && (
                    <Card.Root p={4} w="full" bg="bg.subtle" borderColor="border">
                        <VStack spacing={4} align="stretch">
                            <HStack justify="space-between">
                                <Text fontWeight="bold" color="fg">
                                    Add New Multiplier
                                </Text>
                                <IconButton
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelAdd}
                                    ariaLabel="Cancel adding"
                                >
                                    <XIcon size={16} />
                                </IconButton>
                            </HStack>

                            <HStack spacing={4} align="end">
                                <Box flex={2}>
                                    <Text fontSize="sm" fontWeight="medium" mb={2}>Label</Text>
                                    <Input
                                        size="sm"
                                        value={tempMultiplier.label}
                                        onChange={(e) => setTempMultiplier({
                                            ...tempMultiplier,
                                            label: e.target.value
                                        })}
                                        placeholder="e.g., Regular Flight, Routes of the week"
                                        autoFocus
                                    />
                                </Box>

                                <Box flex={1}>
                                    <Text fontSize="sm" fontWeight="medium" mb={2}>Value</Text>
                                    <Input
                                        size="sm"
                                        type="number"
                                        value={tempMultiplier.value}
                                        onChange={(e) => setTempMultiplier({
                                            ...tempMultiplier,
                                            value: e.target.value === "" ? "" : parseFloat(e.target.value)
                                        })}
                                        min={0}
                                        step={1}
                                        max={999}
                                    />
                                </Box>

                                <Box flex={2}>
                                    <Text fontSize="sm" fontWeight="medium" mb={2}>Description</Text>
                                    <Input
                                        size="sm"
                                        value={tempMultiplier.description}
                                        onChange={(e) => setTempMultiplier({
                                            ...tempMultiplier,
                                            description: e.target.value
                                        })}
                                        placeholder="e.g., rotw, botw, ceo route"
                                    />
                                </Box>

                                <Button
                                    size="sm"
                                    onClick={addMultiplier}
                                    colorPalette="blue"
                                >
                                    Add
                                </Button>
                            </HStack>
                        </VStack>
                    </Card.Root>
                )}
            </VStack>

            {/* Drag and Drop Context */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={multipliers.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <VStack spacing={3} align="stretch">
                        {multipliers.length === 0 && !isAdding ? (
                            <Card.Root p={8} textAlign="center" bg="bg.subtle">
                                <VStack spacing={3}>
                                    <Text color="fg.muted" fontWeight="medium">
                                        No multipliers configured yet
                                    </Text>
                                    <Text color="fg.muted" fontSize="sm">
                                        Click "Add Multiplier" to get started
                                    </Text>
                                </VStack>
                            </Card.Root>
                        ) : (
                            multipliers.map((multiplier, index) => (
                                <SortableMultiplierCard
                                    key={multiplier.id}
                                    multiplier={multiplier}
                                    index={index}
                                    isEditing={editingId === multiplier.id}
                                    onStartEdit={startEditing}
                                    onSave={saveMultiplier}
                                    onCancelEdit={cancelEditing}
                                    onDelete={deleteMultiplier}
                                    onUpdate={updateMultiplier}
                                />
                            ))
                        )}
                    </VStack>
                </SortableContext>

                <DragOverlay>
                    {activeMultiplier ? (
                        <Card.Root p={4} bg="bg.default" shadow="lg" opacity={0.8}>
                            <HStack spacing={3}>
                                <GripVertical width={16} height={16} fill="currentColor" />
                                <Text fontWeight="bold" color="fg">{activeMultiplier.label}</Text>
                                <Badge colorPalette="blue">{activeMultiplier.value}x</Badge>
                            </HStack>
                        </Card.Root>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Statistics */}
            {multipliers.length > 0 && (
                <Card.Root mt={6} p={4} bg="bg.subtle">
                    <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium" color="fg">
                                Total Multipliers: {multipliers.length}
                            </Text>
                            <Text fontSize="xs" color="fg.muted">
                                Drag cards to reorder • Values affect flight points
                            </Text>
                        </VStack>
                        <VStack align="end" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium" color="fg">
                                Average: {(multipliers.reduce((sum, m) => sum + (m.value === "" ? 0 : Number(m.value) || 0), 0) / multipliers.length).toFixed(2)}x
                            </Text>
                            <Text fontSize="xs" color="fg.muted">
                                Range: {Math.min(...multipliers.map(m => m.value === "" ? 0 : Number(m.value) || 0))}x - {Math.max(...multipliers.map(m => m.value === "" ? 0 : Number(m.value) || 0))}x
                            </Text>
                        </VStack>
                    </HStack>
                </Card.Root>
            )}
        </Box>
    );
}

