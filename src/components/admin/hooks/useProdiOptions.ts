import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function useProdiOptions() {
  const prodiOptions = useQuery(api.admin.listProdiOptions, {});
  return { prodiOptions: prodiOptions ?? [] };
}

// undefined university = the home institution (UPN); only label it when it's
// somewhere else, so admin dropdowns/lists can tell a prodi's university apart
// at a glance instead of showing a flat unlabeled name.
export function prodiLabel(p: { name: string; university?: string }): string {
  return p.university ? `${p.name} (${p.university})` : p.name;
}
