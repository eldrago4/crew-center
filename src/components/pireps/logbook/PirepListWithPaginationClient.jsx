'use client';

import {
  Box,
  VStack,
  Text,
  ButtonGroup,
  IconButton,
  Pagination,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  HStack,
  Stack,
  Card,
  Separator
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useState, useEffect } from 'react';
import PirepCard from './PirepCard';

const PirepListWithPagination = ({ initialPireps, initialTotalPireps, userId }) => {
  const [ pireps, setPireps ] = useState(initialPireps);
  const [ currentPage, setCurrentPage ] = useState(1);
  const [ totalPireps, setTotalPolls ] = useState(initialTotalPireps);
  const [ loading, setLoading ] = useState(false);
  const pageSize = 8;

  useEffect(() => {
    const fetchPireps = async () => {
      if (currentPage === 1 && initialPireps.length > 0 && !loading) {
        setPireps(initialPireps);
        setTotalPolls(initialTotalPireps);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/users/pireps?id=${userId}&page=${currentPage}&pageSize=${pageSize}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PIREPs');
        }

        const data = await response.json();
        setPireps(data.data);
        setTotalPolls(data.total);
      } catch (error) {
        console.error("Error fetching PIREPs:", error);
        setPireps([]);
        setTotalPolls(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPireps();
  }, [ currentPage, userId ]);

  const handlePageChange = (details) => {
    setCurrentPage(details.page);
  };

  if (loading) {
    return (
      <VStack spacing="4" align="start" width="full">
        {Array.from({ length: pageSize }).map((_, index) => (
          <Card.Root
            key={index}
            direction="row"
            overflow="hidden"
            variant="outline"
            width="full"
            maxW="3xl"
            p="0"
          >
            <HStack spacing="0" align="stretch">
              <VStack align="start" spacing="4" flex="1" p="4">
                <HStack w="full" justify="space-between">
                  <VStack align="start" spacing="1">
                    <Skeleton height="14px" width="50px" />
                    <Skeleton height="24px" width="100px" />
                  </VStack>
                  <VStack align="end" spacing="1">
                    <Skeleton height="14px" width="50px" />
                    <Skeleton height="24px" width="100px" />
                  </VStack>
                </HStack>

                <HStack w="full" justify="space-between" align="center">
                  <VStack align="start" spacing="1">
                    <Skeleton height="14px" width="40px" />
                    <Skeleton height="36px" width="80px" />
                  </VStack>
                  <SkeletonCircle size="8" />
                  <VStack align="end" spacing="1">
                    <Skeleton height="14px" width="40px" />
                    <Skeleton height="36px" width="80px" />
                  </VStack>
                </HStack>

                <Skeleton height="20px" width="full" mt="2" />
              </VStack>

              <Skeleton width="1px" height="full" />

              <VStack w="140px" justify="space-between" p="4" bg="gray.100">
                <VStack spacing="1">
                  <Skeleton height="14px" width="70px" />
                  <Skeleton height="24px" width="60px" />
                </VStack>
                <VStack spacing="1">
                  <Skeleton height="14px" width="70px" />
                  <Skeleton height="24px" width="40px" />
                </VStack>
                <Skeleton height="30px" width="100px" borderRadius="md" />
              </VStack>
            </HStack>
          </Card.Root>
        ))}
      </VStack>
    );
  }

  return (
    <>
      {pireps.length > 0 ? (
        <VStack spacing="4" align="start">
          {pireps.map((pirep) => (
            <PirepCard key={pirep.pirepId} pirep={pirep} />
          ))}
          <Box mt="8" w="full" display="flex" justifyContent="center">
            <Pagination.Root
              count={totalPireps}
              pageSize={pageSize}
              page={currentPage}
              onPageChange={handlePageChange}
              siblingCount={1}
            >
              <ButtonGroup variant="ghost" size="md">
                <Pagination.PrevTrigger asChild>
                  <IconButton aria-label="Previous Page">
                    <LuChevronLeft />
                  </IconButton>
                </Pagination.PrevTrigger>

                <Pagination.Items
                  render={(page) => (
                    <IconButton
                      aria-label={`Page ${page.value}`}
                      variant={{ base: "ghost", _selected: "outline" }}
                    >
                      {page.value}
                    </IconButton>
                  )}
                />

                <Pagination.NextTrigger asChild>
                  <IconButton aria-label="Next Page">
                    <LuChevronRight />
                  </IconButton>
                </Pagination.NextTrigger>
              </ButtonGroup>
            </Pagination.Root>
          </Box>
        </VStack>
      ) : (
        <Text>No PIREPs found.</Text>
      )}
    </>
  );
};

export default PirepListWithPagination;
