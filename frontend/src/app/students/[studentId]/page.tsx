import { StudentProfileScreen } from "@/components/hspts-screens";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentProfileScreen studentId={studentId} />;
}
