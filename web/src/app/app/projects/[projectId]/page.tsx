import { redirect } from "next/navigation";

export default function ProjectIndexPage({ params }: { params: { projectId: string } }) {
  redirect(`/app/projects/${params.projectId}/world`);
}
