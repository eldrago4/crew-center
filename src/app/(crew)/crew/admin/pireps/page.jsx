import CrewPage from '@/components/crew-runtime/CrewPage';

// Staff-only access is enforced by the admin layout; the review tabs fetch their
// own data. UI in ./AdminPirepsView.jsx, loaded client-only.
export default function AdminPirepsPage() {
    return <CrewPage id="admin-pireps" />;
}
