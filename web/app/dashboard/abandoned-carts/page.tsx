"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Trash2,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuContent,
  DropdownMenuItem,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { useCurrency } from "@/hooks/dashboard/useCurrency";
import {
  getAbandonedSessions,
  getSessionStats,
  getSessionById,
  markAsRecovered,
  deleteSession,
  addAdminNote,
} from "@/store/services/cartSessionService";
import toast from "react-hot-toast";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface CartSession {
  id: string;
  _id?: string;
  sessionId: string;
  status: "active" | "abandoned" | "converted" | "recovered";
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  cartItems: Array<{
    productId: string;
    productName: { ar?: string; en?: string };
    productImage?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  cartTotal: number;
  currency: string;
  createdAt: string;
  lastActivityAt: string;
  abandonedAt?: string;
  checkoutStartedAt?: string;
  adminNotes?: string;
  recoveryAttempts: number;
}

interface Stats {
  total: {
    active: number;
    abandoned: number;
    converted: number;
    recovered: number;
  };
  abandoned: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  potentialRevenue: number;
  conversionRate: number;
}

export default function AbandonedCartsPage() {
  const { t, isRtl } = useAdminLocale();
  const { formatMoney } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<CartSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("abandoned");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSession, setSelectedSession] = useState<CartSession | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSessionId, setNoteSessionId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        getAbandonedSessions({
          page,
          limit: 20,
          status: statusFilter,
          search,
        }),
        getSessionStats(),
      ]);

      setSessions(sessionsRes.data.sessions || []);
      setTotalPages(sessionsRes.data.pagination?.pages || 1);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error(t("admin.abandonedCarts.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetails = async (session: CartSession) => {
    try {
      const res = await getSessionById(session.id || session._id || "");
      setSelectedSession(res.data);
      setDetailsOpen(true);
    } catch (error) {
      toast.error(t("admin.abandonedCarts.fetchError"));
    }
  };

  const handleMarkRecovered = async (id: string) => {
    try {
      await markAsRecovered(id);
      toast.success(t("admin.abandonedCarts.markedRecovered"));
      fetchData();
    } catch (error) {
      toast.error(t("admin.abandonedCarts.updateError"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.abandonedCarts.confirmDelete"))) return;
    try {
      await deleteSession(id);
      toast.success(t("admin.abandonedCarts.deleted"));
      fetchData();
    } catch (error) {
      toast.error(t("admin.abandonedCarts.deleteError"));
    }
  };

  const handleAddNote = async () => {
    if (!noteSessionId || !noteText.trim()) return;
    try {
      await addAdminNote(noteSessionId, noteText);
      toast.success(t("admin.abandonedCarts.noteAdded"));
      setNoteDialogOpen(false);
      setNoteText("");
      setNoteSessionId("");
      fetchData();
    } catch (error) {
      toast.error(t("admin.abandonedCarts.updateError"));
    }
  };

  const openNoteDialog = (session: CartSession) => {
    setNoteSessionId(session.id || session._id || "");
    setNoteText(session.adminNotes || "");
    setNoteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-blue-100 text-blue-800",
      abandoned: "bg-red-100 text-red-800",
      converted: "bg-green-100 text-green-800",
      recovered: "bg-purple-100 text-purple-800",
    };
    const labels: Record<string, string> = {
      active: t("admin.abandonedCarts.statusActive"),
      abandoned: t("admin.abandonedCarts.statusAbandoned"),
      converted: t("admin.abandonedCarts.statusConverted"),
      recovered: t("admin.abandonedCarts.statusRecovered"),
    };
    return (
      <Badge className={styles[status] || styles.abandoned}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatTime = (date?: string) => {
    if (!date) return "-";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: isRtl ? ar : enUS,
    });
  };

  const getLocalizedName = (name?: { ar?: string; en?: string }) => {
    if (!name) return "-";
    return (isRtl ? name.ar : name.en) || name.en || name.ar || "-";
  };

  return (
    <div className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("admin.abandonedCarts.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.abandonedCarts.description")}
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"} ${
              loading ? "animate-spin" : ""
            }`}
          />
          {t("admin.abandonedCarts.refresh")}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.abandonedCarts.abandonedToday")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.abandoned.today}</div>
              <p className="text-xs text-muted-foreground">
                {t("admin.abandonedCarts.thisWeek")}: {stats.abandoned.thisWeek}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.abandonedCarts.totalAbandoned")}
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.abandoned}</div>
              <p className="text-xs text-muted-foreground">
                {t("admin.abandonedCarts.recovered")}: {stats.total.recovered}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.abandonedCarts.potentialRevenue")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMoney(stats.potentialRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.abandonedCarts.fromAbandonedCarts")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.abandonedCarts.conversionRate")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {t("admin.abandonedCarts.converted")}: {stats.total.converted}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className={`absolute ${
                  isRtl ? "right-3" : "left-3"
                } top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`}
              />
              <Input
                placeholder={t("admin.abandonedCarts.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={isRtl ? "pr-10" : "pl-10"}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" dir={isRtl ? "rtl" : "ltr"}>
                <SelectValue
                  placeholder={t("admin.abandonedCarts.filterByStatus")}
                />
              </SelectTrigger>
              <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                <SelectItem value="all">
                  {t("admin.abandonedCarts.allStatuses")}
                </SelectItem>
                <SelectItem value="abandoned">
                  {t("admin.abandonedCarts.statusAbandoned")}
                </SelectItem>
                <SelectItem value="active">
                  {t("admin.abandonedCarts.statusActive")}
                </SelectItem>
                <SelectItem value="recovered">
                  {t("admin.abandonedCarts.statusRecovered")}
                </SelectItem>
                <SelectItem value="converted">
                  {t("admin.abandonedCarts.statusConverted")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">
                  {t("admin.abandonedCarts.customer")}
                </TableHead>
                <TableHead className="text-start">
                  {t("admin.abandonedCarts.items")}
                </TableHead>
                <TableHead className="text-start">
                  {t("admin.abandonedCarts.cartValue")}
                </TableHead>
                <TableHead className="text-start">
                  {t("admin.abandonedCarts.status")}
                </TableHead>
                <TableHead className="text-start">
                  {t("admin.abandonedCarts.lastActivity")}
                </TableHead>
                <TableHead className="text-start">
                  {t("admin.abandonedCarts.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("admin.abandonedCarts.noSessions")}
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id || session._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {session.customerInfo?.name ||
                            t("admin.abandonedCarts.anonymous")}
                        </span>
                        {session.customerInfo?.email && (
                          <span className="text-sm text-muted-foreground">
                            {session.customerInfo.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {session.cartItems.length}{" "}
                          {t("admin.abandonedCarts.items")}
                        </span>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {getLocalizedName(session.cartItems[0]?.productName)}
                          {session.cartItems.length > 1 && "..."}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {session.cartTotal.toLocaleString()} {session.currency}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatTime(session.lastActivityAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(session)}
                          >
                            <Eye
                              className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                            />
                            {t("admin.abandonedCarts.viewDetails")}
                          </DropdownMenuItem>
                          {session.customerInfo?.phone && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `https://wa.me/${session.customerInfo!.phone!.replace(
                                    /\D/g,
                                    ""
                                  )}`,
                                  "_blank"
                                )
                              }
                            >
                              <Phone
                                className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                              />
                              {t("admin.abandonedCarts.contactWhatsApp")}
                            </DropdownMenuItem>
                          )}
                          {session.customerInfo?.email && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `mailto:${session.customerInfo?.email}`,
                                  "_blank"
                                )
                              }
                            >
                              <Mail
                                className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                              />
                              {t("admin.abandonedCarts.sendEmail")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openNoteDialog(session)}
                          >
                            <MessageSquare
                              className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                            />
                            {t("admin.abandonedCarts.addNote")}
                          </DropdownMenuItem>
                          {session.status === "abandoned" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleMarkRecovered(
                                  session.id || session._id || ""
                                )
                              }
                            >
                              <CheckCircle
                                className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                              />
                              {t("admin.abandonedCarts.markRecovered")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(session.id || session._id || "")
                            }
                            className="text-red-600"
                          >
                            <Trash2
                              className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                            />
                            {t("admin.abandonedCarts.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t("common.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {t("admin.abandonedCarts.sessionDetails")}
            </DialogTitle>
            <DialogDescription>{selectedSession?.sessionId}</DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {t("admin.abandonedCarts.customer")}
                  </Label>
                  <p className="font-medium">
                    {selectedSession.customerInfo?.name || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("checkout.email")}
                  </Label>
                  <p className="font-medium">
                    {selectedSession.customerInfo?.email || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("checkout.phone")}
                  </Label>
                  <p className="font-medium">
                    {selectedSession.customerInfo?.phone || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("admin.abandonedCarts.status")}
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSession.status)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cart Items */}
              <div>
                <Label className="text-muted-foreground mb-2 block">
                  {t("admin.abandonedCarts.cartItems")}
                </Label>
                <div className="space-y-2">
                  {selectedSession.cartItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {getLocalizedName(item.productName)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            x{item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">
                        {item.totalPrice.toLocaleString()}{" "}
                        {selectedSession.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold">
                <span>{t("cart.total")}</span>
                <span className="text-green-600">
                  {selectedSession.cartTotal.toLocaleString()}{" "}
                  {selectedSession.currency}
                </span>
              </div>

              {/* Timeline */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {t("admin.abandonedCarts.created")}:{" "}
                  {format(new Date(selectedSession.createdAt), "PPp", {
                    locale: isRtl ? ar : enUS,
                  })}
                </p>
                <p>
                  {t("admin.abandonedCarts.lastActivity")}:{" "}
                  {formatTime(selectedSession.lastActivityAt)}
                </p>
                {selectedSession.abandonedAt && (
                  <p>
                    {t("admin.abandonedCarts.abandonedAt")}:{" "}
                    {formatTime(selectedSession.abandonedAt)}
                  </p>
                )}
              </div>

              {/* Notes */}
              {selectedSession.adminNotes && (
                <div>
                  <Label className="text-muted-foreground">
                    {t("admin.abandonedCarts.notes")}
                  </Label>
                  <p className="mt-1 p-2 bg-yellow-50 rounded border border-yellow-200">
                    {selectedSession.adminNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("admin.abandonedCarts.addNote")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t("admin.abandonedCarts.notePlaceholder")}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNoteDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddNote}>{t("common.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
