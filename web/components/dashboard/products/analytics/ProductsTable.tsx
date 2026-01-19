"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
} from "lucide-react";
import { ProductAnalyticsItem } from "@/store/services/dashboardService";

interface ProductsTableProps {
  products: ProductAnalyticsItem[];
  isRtl: boolean;
  formatCurrency: (val: number) => string;
}

const LOCAL_STORAGE_KEY = "product-analytics-columns";
const PAGE_SIZE_KEY = "product-analytics-page-size";

type SortField =
  | "salesCount"
  | "revenue"
  | "refundsCount"
  | "views"
  | "netRevenue"
  | "refundAmount";
type SortOrder = "asc" | "desc";

interface ColumnConfig {
  id: string;
  label: string;
  labelAr: string;
  visible: boolean;
  sortable: boolean;
  field?: SortField;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: "product",
    label: "Product",
    labelAr: "المنتج",
    visible: true,
    sortable: false,
  },
  {
    id: "salesCount",
    label: "Sales",
    labelAr: "المبيعات",
    visible: true,
    sortable: true,
    field: "salesCount",
  },
  {
    id: "revenue",
    label: "Revenue",
    labelAr: "الإيرادات",
    visible: true,
    sortable: true,
    field: "revenue",
  },
  {
    id: "refundsCount",
    label: "Refunds",
    labelAr: "المرتجعات",
    visible: true,
    sortable: true,
    field: "refundsCount",
  },
  {
    id: "refundAmount",
    label: "Refund Amount",
    labelAr: "قيمة المرتجع",
    visible: false,
    sortable: true,
    field: "refundAmount",
  },
  {
    id: "views",
    label: "Views",
    labelAr: "المشاهدات",
    visible: true,
    sortable: true,
    field: "views",
  },
  {
    id: "netRevenue",
    label: "Net Revenue",
    labelAr: "صافي الإيرادات",
    visible: true,
    sortable: true,
    field: "netRevenue",
  },
];

export function ProductsTable({
  products,
  isRtl,
  formatCurrency,
}: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [filterSales, setFilterSales] = useState<string>("all");

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        setColumns(
          DEFAULT_COLUMNS.map((col) => ({
            ...col,
            visible: parsed[col.id] ?? col.visible,
          }))
        );
      } catch (e) {
        console.error("Failed to parse saved columns", e);
      }
    }

    const savedPageSize = localStorage.getItem(PAGE_SIZE_KEY);
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize, 10) || 10);
    }
  }, []);

  // Save column preferences
  const toggleColumn = (columnId: string) => {
    const updated = columns.map((col) =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    setColumns(updated);

    const visibilityMap = updated.reduce((acc, col) => {
      acc[col.id] = col.visible;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(visibilityMap));
  };

  // Save page size
  const handlePageSizeChange = (size: string) => {
    const newSize = parseInt(size, 10);
    setPageSize(newSize);
    setCurrentPage(1);
    localStorage.setItem(PAGE_SIZE_KEY, size);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const title =
      typeof product.title === "object"
        ? isRtl
          ? product.title.ar
          : product.title.en
        : product.title;
    const matchesSearch =
      title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSalesFilter =
      filterSales === "all" ||
      (filterSales === "with-sales" && product.salesCount > 0) ||
      (filterSales === "no-sales" && product.salesCount === 0);

    return matchesSearch && matchesSalesFilter;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / pageSize);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Get product title properly
  const getTitle = (product: ProductAnalyticsItem) => {
    if (!product.title) return product.slug;

    // Handle localized title object {ar: "...", en: "..."}
    if (typeof product.title === "object" && product.title !== null) {
      const localizedTitle = isRtl
        ? (product.title as any).ar
        : (product.title as any).en;
      return localizedTitle || product.slug;
    }

    // Fallback to string title or slug
    return String(product.title) || product.slug;
  };

  const SortHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField === field ? (
        sortOrder === "desc" ? (
          <ArrowDown className="ms-1 h-3 w-3" />
        ) : (
          <ArrowUp className="ms-1 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ms-1 h-3 w-3 opacity-40" />
      )}
    </Button>
  );

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>
                {isRtl ? "تحليلات المنتجات" : "Product Analytics"}
              </CardTitle>
              <CardDescription>
                {isRtl
                  ? `${filteredProducts.length} من ${products.length} منتج`
                  : `${filteredProducts.length} of ${products.length} products`}
              </CardDescription>
            </div>

            {/* Column Settings */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 me-2" />
                    {isRtl ? "الأعمدة" : "Columns"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 text-start">
                  <div dir={isRtl ? "rtl" : "ltr"}>
                    <DropdownMenuLabel>
                      {isRtl ? "إظهار الأعمدة" : "Show Columns"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={col.visible}
                        onCheckedChange={() => toggleColumn(col.id)}
                        disabled={col.id === "product"}
                        className="text-start"
                      >
                        {isRtl ? col.labelAr : col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRtl ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Sales Filter */}
            <Select value={filterSales} onValueChange={setFilterSales}>
              <SelectTrigger className="w-[160px]">
                <SelectValue
                  placeholder={isRtl ? "فلتر المبيعات" : "Sales Filter"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRtl ? "الكل" : "All"}</SelectItem>
                <SelectItem value="with-sales">
                  {isRtl ? "بها مبيعات" : "With Sales"}
                </SelectItem>
                <SelectItem value="no-sales">
                  {isRtl ? "بدون مبيعات" : "No Sales"}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.id}
                    className={
                      col.id !== "product"
                        ? "text-center"
                        : "min-w-[200px] text-start"
                    }
                  >
                    {col.sortable && col.field ? (
                      <SortHeader
                        field={col.field}
                        label={isRtl ? col.labelAr : col.label}
                      />
                    ) : isRtl ? (
                      col.labelAr
                    ) : (
                      col.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  {columns
                    .filter((c) => c.visible)
                    .map((col) => {
                      switch (col.id) {
                        case "product":
                          return (
                            <TableCell key={col.id}>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {getTitle(product)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {product.slug}
                                  </p>
                                </div>
                                <a
                                  href={`https://genoun.com/products/${product.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            </TableCell>
                          );
                        case "salesCount":
                          return (
                            <TableCell key={col.id} className="text-center">
                              <Badge
                                variant={
                                  product.salesCount > 0
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {product.salesCount}
                              </Badge>
                            </TableCell>
                          );
                        case "revenue":
                          return (
                            <TableCell
                              key={col.id}
                              className="text-center font-medium text-green-600"
                            >
                              {formatCurrency(product.revenue)}
                            </TableCell>
                          );
                        case "refundsCount":
                          return (
                            <TableCell key={col.id} className="text-center">
                              {product.refundsCount > 0 ? (
                                <Badge variant="destructive">
                                  {product.refundsCount}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                          );
                        case "refundAmount":
                          return (
                            <TableCell
                              key={col.id}
                              className="text-center text-red-600"
                            >
                              {formatCurrency(product.refundAmount)}
                            </TableCell>
                          );
                        case "views":
                          return (
                            <TableCell
                              key={col.id}
                              className="text-center text-muted-foreground"
                            >
                              {product.views.toLocaleString()}
                            </TableCell>
                          );
                        case "netRevenue":
                          return (
                            <TableCell
                              key={col.id}
                              className="text-center font-medium"
                            >
                              <span
                                className={
                                  product.netRevenue >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {formatCurrency(product.netRevenue)}
                              </span>
                            </TableCell>
                          );
                        default:
                          return null;
                      }
                    })}
                </TableRow>
              ))}
              {paginatedProducts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {isRtl ? "لا توجد منتجات" : "No products found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              {isRtl
                ? `صفحة ${currentPage} من ${totalPages} (${sortedProducts.length} منتج)`
                : `Page ${currentPage} of ${totalPages} (${sortedProducts.length} products)`}
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
