import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}

/** "Page 2 of 5 · 93 total" with previous/next. Hidden when one page fits. */
export function Pagination({ page, pages, total, onPage }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 pt-4"
    >
      <p className="text-ink-subtle">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          icon={<ChevronLeft className="size-4" aria-hidden="true" />}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
