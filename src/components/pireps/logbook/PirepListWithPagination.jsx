

'use client';

import {
  Box,
  VStack,
  Text,
  ButtonGroup,
  IconButton,
  Pagination,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useState, useEffect } from 'react';
import PirepCard from './PirepCard';

const PirepListWithPagination = ({ initialPireps, initialTotalPireps, userId }) => {
  const [ pireps, setPireps ] = useState(initialPireps);
  const [ currentPage, setCurrentPage ] = useState(1);
  const [ totalPireps, setTotalPireps ] = useState(initialTotalPireps);
  const pageSize = 8;

  useEffect(() => {
    const fetchPireps = async () => {
      if (currentPage === 1 && pireps.length > 0 && totalPireps > 0 && initialPireps.length > 0) {
        return;
      }

      try {
        const response = await fetch(`/api/users/pireps?id=${userId}&page=${currentPage}&pageSize=${pageSize}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PIREPs');
        }

        const data = await response.json();
        setPireps(data.data);
        setTotalPireps(data.total);
      } catch (error) {
        console.error("Error fetching PIREPs:", error);
        setPireps([]);
        setTotalPireps(0);
      }
    };

    fetchPireps();
  }, [ currentPage, userId, initialPireps, totalPireps ]);

  const handlePageChange = (details) => {
    setCurrentPage(details.page);
  };

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
