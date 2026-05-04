"use client";

import { useParams } from "next/navigation";

import { ProjectDetailPage } from "./project-detail-page";

export default function ProjectPage() {
  const params = useParams<{ projectId: string | string[] }>();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

  return <ProjectDetailPage projectId={projectId} />;
}
