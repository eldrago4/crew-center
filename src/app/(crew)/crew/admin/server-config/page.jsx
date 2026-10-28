import { Box, Heading, Container, VStack, Text } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import DatabaseViewer from '@/components/admin/DatabaseViewer';
import ServerConsole from '@/components/admin/ServerConsole';
import { getStaff } from '@/app/shared/users';
import { backupConfigured } from '@/db/failover';
import { auth } from '@/auth';
import { getConsoleState } from './actions';
import nextPackage from 'next/package.json';

// Read from the environment only, so this costs nothing to render.
function deploymentInfo() {
    const sha = process.env.VERCEL_GIT_COMMIT_SHA;
    const owner = process.env.VERCEL_GIT_REPO_OWNER;
    const repo = process.env.VERCEL_GIT_REPO_SLUG;
    return {
        env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
        region: process.env.VERCEL_REGION ?? '—',
        commit: sha ? sha.slice(0, 7) : 'local',
        commitUrl: sha && owner && repo ? `https://github.com/${owner}/${repo}/commit/${sha}` : null,
        commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
        next: nextPackage.version,
        node: process.versions.node,
        maintenanceEnv: process.env.MAINTENANCE_MODE === '1',
    };
}

export default async function ServerConfigPage() {
    const session = await auth();
    if (!session?.user?.permissions?.includes('ceo')) {
        redirect('/crew/dashboard');
    }

    let initialFleetData = '';
    try {
        initialFleetData = await getStaff();
    } catch (error) {
        console.error("Error fetching staff data on server:", error);
        initialFleetData = 'Error loading staff data.';
    }

    let consoleState = null;
    try {
        consoleState = await getConsoleState();
    } catch (error) {
        console.error('Error reading server console state:', error);
    }

    return (
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Container maxW="100%" py={{ base: 4, md: 8 }}>
                <VStack gap={6} align="stretch">
                    <Heading size="xl" color="fg">
                        [CEO] Server Configuration
                    </Heading>
                    {consoleState ? (
                        <ServerConsole
                            initialState={consoleState}
                            deployment={deploymentInfo()}
                            standbyConfigured={backupConfigured}
                        />
                    ) : (
                        <Text color="red.500">Couldn&apos;t reach Redis — maintenance and database controls are unavailable.</Text>
                    )}
                    <Heading size="md" color="fg" mt={4}>Staff permissions</Heading>
                    <DatabaseViewer initialModuleData={initialFleetData} moduleName="staff" redis={true} />
                </VStack>
            </Container>
        </Box>
    );
}
