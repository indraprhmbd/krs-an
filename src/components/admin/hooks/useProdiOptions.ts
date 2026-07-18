import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function useProdiOptions() {
  const prodiOptions = useQuery(api.admin.listProdiOptions, {});
  return { prodiOptions: prodiOptions ?? [] };
}
