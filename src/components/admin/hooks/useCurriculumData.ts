import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function useCurriculumData(prodi: string, semester: number) {
  const [search, setSearch] = useState("");

  const curriculumData = useQuery(api.admin.listCurriculum, {
    prodi: prodi,
    semester: semester,
  });

  const filteredCurriculum = useMemo(() => {
    if (!curriculumData) return [];
    return curriculumData.filter(
      (c: any) =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [curriculumData, search]);

  return {
    rawCurriculum: curriculumData,
    search,
    setSearch,
    filteredCurriculum,
  };
}
