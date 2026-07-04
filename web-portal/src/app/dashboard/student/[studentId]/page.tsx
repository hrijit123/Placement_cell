import DossierView from "./DossierView";

export default async function StudentDossierPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <DossierView studentId={studentId} />;
}
