"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  getUserPaymentHistoryThunk,
  cancelPaymentThunk,
  Payment,
} from "@/store/services/paymentService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Calendar,
  DollarSign,
  Tag,
  X,
  FileImage,
} from "lucide-react";

export function OrdersTab({
  initialData = [],
  isArabic,
}: {
  initialData?: any[];
  isArabic?: boolean;
}) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const tProducts = useTranslations("products");
  const tService = useTranslations("services");

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    payments,
    isLoading: isPaymentLoading,
    isError: isPaymentError,
    message: paymentMessage,
  } = useSelector((state: RootState) => state.payments);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(initialData.length > 0);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const currentPayments =
    payments.length > 0 ? payments : initialData.length > 0 ? initialData : [];

  useEffect(() => {
    if (
      user &&
      !hasFetched &&
      payments.length === 0 &&
      initialData.length === 0
    ) {
      // @ts-ignore
      dispatch(getUserPaymentHistoryThunk(user._id || user.id));
      setHasFetched(true);
    }
  }, [dispatch, user, hasFetched, payments.length, initialData.length]);

  const getStatusVariant = (status: string) => {
    if (status === "success") return "default";
    if (status === "pending") return "secondary";
    return "destructive";
  };

  const getStatusColor = (status: string) => {
    if (status === "success") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  // Show loading if we haven't fetched yet OR if we're currently loading with no data
  if ((!hasFetched || isPaymentLoading) && currentPayments.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ms-2">{tCommon("loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── DESKTOP TABLE (hidden on mobile) ─── */}
      <div className="hidden sm:block rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">
                {t("orders.orderId")}
              </TableHead>
              <TableHead className="text-start">{t("orders.date")}</TableHead>
              <TableHead className="text-start">{t("orders.amount")}</TableHead>
              <TableHead className="text-start">{t("orders.status")}</TableHead>
              <TableHead className="text-end">{t("orders.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPaymentLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">{tCommon("loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("orders.noOrders")}
                </TableCell>
              </TableRow>
            ) : (
              currentPayments.map((payment: any) => (
                <TableRow key={payment.id || payment._id}>
                  <TableCell className="font-medium text-start">
                    #{String(payment.id || (payment as any)._id).slice(-6)}
                  </TableCell>
                  <TableCell className="text-start">
                    {new Date(payment.createdAt || "").toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-start">
                    {payment.amount} {payment.currency}
                  </TableCell>
                  <TableCell className="text-start">
                    <Badge
                      variant={getStatusVariant(payment.status)}
                    >
                      {t(`statuses.${payment.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-2">
                      {payment.paymentDetails?.items && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Search className="h-4 w-4 me-2" />
                          {t("orders.viewDetails")}
                        </Button>
                      )}
                      {payment.paymentProofUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsProofDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 me-2" />
                          {t("orders.viewProof")}
                        </Button>
                      )}
                      {payment.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => {
                            if (confirm(t("orders.confirmCancel"))) {
                              dispatch(
                                cancelPaymentThunk(
                                  payment.id || (payment as any)._id
                                )
                              );
                            }
                          }}
                        >
                          <span className="h-4 w-4 me-2 text-lg leading-3">
                            ×
                          </span>
                          {t("orders.cancelOrder")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── MOBILE CARDS (visible only on mobile) ─── */}
      <div className="sm:hidden space-y-3">
        {isPaymentLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ms-2">{tCommon("loading")}</span>
          </div>
        ) : currentPayments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {t("orders.noOrders")}
          </div>
        ) : (
          currentPayments.map((payment: any) => {
            const orderId = String(payment.id || (payment as any)._id);
            const shortId = orderId.slice(-6);
            const isExpanded = expandedOrderId === orderId;

            return (
              <div
                key={orderId}
                className="rounded-xl border bg-white dark:bg-gray-950 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* ── Summary Row (always visible) ── */}
                <button
                  className="w-full text-start px-4 py-3 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-900 transition-colors"
                  onClick={() => toggleExpand(orderId)}
                >
                  {/* Order icon */}
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">
                        #{shortId}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(payment.status)}`}
                      >
                        {t(`statuses.${payment.status}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(payment.createdAt || "").toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="h-3 w-3" />
                        {payment.amount} {payment.currency}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <span className="flex-shrink-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {/* ── Expanded Details Panel ── */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 dark:bg-gray-900 px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Detail rows */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("orders.orderId")}
                        </p>
                        <p className="font-medium">#{shortId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("orders.date")}
                        </p>
                        <p className="font-medium">
                          {new Date(payment.createdAt || "").toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("orders.amount")}
                        </p>
                        <p className="font-semibold text-primary">
                          {payment.amount} {payment.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("orders.status")}
                        </p>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(payment.status)}`}
                        >
                          {t(`statuses.${payment.status}`)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {payment.paymentDetails?.items && (
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Search className="h-3.5 w-3.5" />
                          {t("orders.viewDetails")}
                        </button>
                      )}
                      {payment.paymentProofUrl && (
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsProofDialogOpen(true);
                          }}
                        >
                          <FileImage className="h-3.5 w-3.5" />
                          {t("orders.viewProof")}
                        </button>
                      )}
                      {payment.status === "pending" && (
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          onClick={() => {
                            if (confirm(t("orders.confirmCancel"))) {
                              dispatch(
                                cancelPaymentThunk(
                                  payment.id || (payment as any)._id
                                )
                              );
                            }
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                          {t("orders.cancelOrder")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── Order Details Dialog ─── */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw]" dir={isArabic ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-start">
              {t("orders.viewDetails")}
            </DialogTitle>
            <DialogDescription className="text-start">
              {t("orders.orderId")} #
              {selectedPayment
                ? String(
                  selectedPayment.id || (selectedPayment as any)._id
                ).slice(-6)
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">
                    {t("reviews.product")}
                  </TableHead>
                  <TableHead className="text-start">
                    {tProducts("quantity")}
                  </TableHead>
                  <TableHead className="text-start">
                    {tService("price") || "Price"}
                  </TableHead>
                  <TableHead className="text-start">
                    {tProducts("total")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPayment?.paymentDetails?.items?.map(
                  (item: any, index: number) => {
                    const unitPrice = Number(
                      item.price ?? item.unitPrice ?? item.originalUnitPrice ?? 0
                    );
                    const lineTotal =
                      Number(item.totalPrice ?? unitPrice * Number(item.quantity || 0)) || 0;
                    return (
                      <TableRow key={index}>
                        <TableCell className="text-start">
                          {item.name}
                          {item.productType === "digital_book" && (
                            <Badge variant="secondary" className="ms-2">
                              {isArabic ? "كتاب رقمي" : "Digital Book"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-start">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-start">
                          {unitPrice} {selectedPayment.currency}
                        </TableCell>
                        <TableCell className="text-start">
                          {lineTotal} {selectedPayment.currency}
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
                <TableRow>
                  <TableCell colSpan={3} className="text-end font-bold">
                    {tProducts("total")}
                  </TableCell>
                  <TableCell className="text-start font-bold">
                    {selectedPayment?.amount} {selectedPayment?.currency}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Payment Proof Dialog ─── */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-start">
              {t("orders.paymentProof")}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            {selectedPayment?.paymentProofUrl ? (
              <img
                src={selectedPayment.paymentProofUrl}
                alt="Payment Proof"
                className="max-h-[80vh] w-auto object-contain rounded-md"
              />
            ) : (
              <p className="text-muted-foreground">{t("orders.noProof")}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
