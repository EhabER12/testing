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
import { Loader2, Search, Eye } from "lucide-react";

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
      <div className="rounded-md border bg-white dark:bg-gray-950">
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
                      variant={
                        payment.status === "success"
                          ? "default"
                          : payment.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
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

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl" dir={isArabic ? "rtl" : "ltr"}>
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
          <div className="mt-4">
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

      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent className="max-w-3xl">
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
