"use client";

import { useEffect, useMemo, useState } from "react";
import { bookService, Book } from "@/store/services/bookService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";
import toast from "react-hot-toast";

type UserRole = "admin" | "moderator" | "teacher" | "user";

const getLocalizedText = (
  text: { ar?: string; en?: string } | string | undefined,
  locale: "ar" | "en"
) => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[locale] || text.en || text.ar || "";
};

export default function BooksDashboardPage() {
  const [role, setRole] = useState<UserRole>("user");
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [books, setBooks] = useState<Book[]>([]);
  const [pendingBooks, setPendingBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === "admin";

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        setRole((parsed?.role || "user") as UserRole);
      }
    } catch {
      setRole("user");
    }

    const htmlDir = document?.documentElement?.dir;
    setLocale(htmlDir === "rtl" ? "ar" : "en");
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mine, pending] = await Promise.all([
        bookService.getMyBooks({ limit: 100 }),
        isAdmin ? bookService.getPendingBooks() : Promise.resolve([]),
      ]);

      setBooks(mine.items || []);
      setPendingBooks(pending || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const handleReview = async (id: string, action: "approve" | "reject") => {
    try {
      const rejectionReason =
        action === "reject"
          ? window.prompt("Reason for rejection (optional):") || ""
          : "";
      await bookService.reviewBook(id, { action, rejectionReason });
      toast.success(action === "approve" ? "Book approved" : "Book rejected");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to review book");
    }
  };

  const approvalBadge = (status?: string) => {
    if (status === "approved") return <Badge className="bg-emerald-600">Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const pendingRequests = useMemo(
    () =>
      (isAdmin ? pendingBooks : books).filter(
        (book) => book.approvalStatus === "pending"
      ),
    [isAdmin, pendingBooks, books]
  );

  const pendingCount = pendingRequests.length;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Digital Books</h1>
          <p className="text-sm text-muted-foreground">
            Track publishing requests and manage digital books
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Pending requests: {pendingCount}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "Pending Publishing Requests" : "My Pending Requests"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending publishing requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((book) => (
                <div
                  key={book.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-semibold">{getLocalizedText(book.name, locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {book.basePrice} {book.currency}
                    </p>
                    {isAdmin && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        by {getLocalizedText(book.createdBy?.fullName, locale) || "Unknown"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {approvalBadge(book.approvalStatus)}
                    {isAdmin && (
                      <>
                        <Button size="sm" onClick={() => handleReview(book.id, "approve")}>
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReview(book.id, "reject")}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "All Digital Books" : "My Digital Books"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : books.length === 0 ? (
            <p className="text-sm text-muted-foreground">No books uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-semibold">{getLocalizedText(book.name, locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {book.basePrice} {book.currency}
                    </p>
                    {book.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">
                        Rejection reason: {book.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {approvalBadge(book.approvalStatus)}
                    <Badge variant={book.isActive ? "default" : "outline"}>
                      {book.isActive ? "Published" : "Hidden"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
