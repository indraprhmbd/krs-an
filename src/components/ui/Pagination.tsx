import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
}: PaginationProps) {
  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart ellipsis logic
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 p-4 border-t border-border bg-muted/30">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onPrev}
        disabled={!canGoPrev}
        className="h-8 w-8 rounded-control border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-card hover:border-border"
      >
        <Icon name="chevron-left" />
      </Button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 text-muted-foreground font-mono text-caption"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page as number)}
            className={`h-8 w-8 rounded-control font-mono text-caption transition-all ${
 currentPage === page
 ? "bg-primary text-primary-foreground hover:opacity-90 border-primary"
 : "border-border text-muted-foreground hover:bg-card hover:border-border hover:text-primary"
 }`}
          >
            {page}
          </Button>
        ),
      )}

      {/* Next Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
        className="h-8 w-8 rounded-control border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-card hover:border-border"
      >
        <Icon name="chevron-right" />
      </Button>
    </div>
  );
}
