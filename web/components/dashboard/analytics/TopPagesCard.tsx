"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface Page {
  path: string;
  title: string;
  views: number;
}

interface TopPagesCardProps {
  pages: Page[];
  isRtl: boolean;
  onPageClick: (path: string) => void;
}

const PAGE_SIZE = 10;

export function TopPagesCard({ pages, isRtl, onPageClick }: TopPagesCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter pages
  const filteredPages = pages.filter(
    (page) =>
      page.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredPages.length / PAGE_SIZE);
  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {isRtl ? "أعلى الصفحات" : "Top Pages"}
            </CardTitle>
            <CardDescription>
              {isRtl ? "انقر للتفاصيل" : "Click for details"}
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRtl ? "بحث..." : "Search..."}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => handleSearchChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {paginatedPages.map((page, i) => {
            // Clean up display - use path as primary, show title only if meaningful
            const isGenericTitle =
              !page.title ||
              page.title === "Genoun" ||
              page.title === "(not set)" ||
              page.title.length < 3;

            const displayPath =
              page.path === "/"
                ? isRtl
                  ? "الصفحة الرئيسية"
                  : "Homepage"
                : page.path;

            const displayTitle = isGenericTitle ? null : page.title;

            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onPageClick(page.path)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate font-mono">
                    {displayPath}
                  </p>
                  {displayTitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {displayTitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ms-4">
                  <Badge variant="secondary">{page.views}</Badge>
                  <a
                    href={`https://genoun.com${page.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
          {paginatedPages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {isRtl ? "لا توجد نتائج" : "No results"}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
