"use client";

import { MeshProvider } from "@meshsdk/react";

export function ClientMeshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MeshProvider>{children}</MeshProvider>;
}
