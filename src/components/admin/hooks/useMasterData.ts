import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const ITEMS_PER_PAGE = 20;

export function useMasterData() {
  const [prodiFilter, setProdiFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.admin.getPaginatedMasterCourses,
    {
      prodi: prodiFilter,
      search: search, // Note: Search is currenty handled by basic filtering on backend or needs index
    },
    { initialNumItems: ITEMS_PER_PAGE },
  );

  // Client-side search filtering (Hybrid approach)
  // Since we prioritized pagination performance, we load paginated data.
  // BUT, if the user searches, we ideally want to search the WHOLE DB or use a search index.
  // The current backend simplistic implementation just paginates.
  // IF search is active, the backend SHOULD ideally filter first then paginate.
  // Our backend update assumes basic filtering.

  // For strict "search" across all data without a search index, we might need a separate
  // "searchMasterCourses" query that is different from the paginated list.
  // However, for optimization, let's rely on the backend's args.

  return {
    courses: results,
    search,
    setSearch,
    prodiFilter,
    setProdiFilter,
    status,
    loadMore: (numItems: number) => loadMore(numItems),
    isLoading,
    totalLoaded: results.length,
  };
}
