'use client'

import { Box } from '@chakra-ui/react';
import StatisticsClient from './StatisticsClient';

export default function StatisticsView(props) {
    return (
        <Box p={{ base: '4', md: '6' }}>
            <StatisticsClient {...props} />
        </Box>
    );
}
