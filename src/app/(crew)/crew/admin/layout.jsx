import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";

export default function RootLayout({ children }) {
  return (
    <ResponsiveCrewLayout isAdmin={true} showSidebar={true}>
      {children}
    </ResponsiveCrewLayout>
  );
}
