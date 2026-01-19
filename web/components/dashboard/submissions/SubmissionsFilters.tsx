import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Calendar, Filter, Download } from "lucide-react";
import { ReadFilter, ExportMode } from "@/lib/submissions/types";

type SubmissionsFiltersProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  readFilter: ReadFilter;
  setReadFilter: (filter: ReadFilter) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  onExport: (mode: ExportMode) => void;
  activeTab: string;
  filteredCount: number;
  allCount: number;
  exportDisabled?: boolean;
};

export function SubmissionsFilters({
  searchQuery,
  setSearchQuery,
  readFilter,
  setReadFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onExport,
  activeTab,
  filteredCount,
  allCount,
  exportDisabled = false,
}: SubmissionsFiltersProps) {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {readFilter === "all"
                  ? "All"
                  : readFilter === "read"
                  ? "Read"
                  : "Unread"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setReadFilter("all")}>
                  <span className={readFilter === "all" ? "font-bold" : ""}>
                    All submissions
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReadFilter("read")}>
                  <span className={readFilter === "read" ? "font-bold" : ""}>
                    Read only
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReadFilter("unread")}>
                  <span className={readFilter === "unread" ? "font-bold" : ""}>
                    Unread only
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" disabled={exportDisabled}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onExport("current")}>
                  Export Current View ({filteredCount})
                </DropdownMenuItem>
                {activeTab !== "all" && (
                  <DropdownMenuItem onClick={() => onExport("form")}>
                    Export Current Form ({filteredCount})
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onExport("all")}>
                  Export All Forms ({allCount})
                </DropdownMenuItem>
                {(dateFrom || dateTo) && (
                  <DropdownMenuItem onClick={() => onExport("dateRange")}>
                    Export Date Range ({filteredCount})
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center space-x-2 flex-1 min-w-[250px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            placeholder="From"
            className="w-[150px]"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            placeholder="To"
            className="w-[150px]"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
