import { redirect } from 'next/navigation';
import { getStaff } from '@/app/shared/users';
import { auth } from '@/auth';
import CrewPage from '@/components/crew-runtime/CrewPage';

export default async function ServerConfigPage() {
    const session = await auth();
    if (!session?.user?.permissions?.includes('ceo')) {
        redirect('/crew/dashboard');
    }

    let initialStaffData = '';
    try {
        initialStaffData = await getStaff();
    } catch (error) {
        console.error("Error fetching staff data on server:", error);
        initialStaffData = 'Error loading staff data.';
    }

    return <CrewPage id="admin-server-config" initialStaffData={initialStaffData} />;
}
