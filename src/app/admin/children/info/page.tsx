import ChildDetailsPage from "@/components/admin/ChildDetailsPage";

// Remove the "use client" directive from this file
// interface ChildPageProps {
//   params: Promise<{
//     id: string;
//   }>;
// }
// Add the generateStaticParams function
export function generateStaticParams() {
  // Generate a list of dummy IDs (1-10)
  //  return [];
  return Array.from({ length: 100 }, (_, i) => ({
    id: String(i + 1),
  }));
}

// Server component that renders the client component
export default async function DynamicModulePage() {
  // const resolvedParams = await params;
  // const { id } = resolvedParams;
  return (
    <>
      <ChildDetailsPage />
    </>
  );
}
