"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCategories } from "@/store/slices/categorySlice";
import { bookService, Book } from "@/store/services/bookService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Check, X } from "lucide-react";
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

const emptyBilingual = { ar: "", en: "" };

export default function BooksDashboardPage() {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.categories);
  const [role, setRole] = useState<UserRole>("user");
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [books, setBooks] = useState<Book[]>([]);
  const [pendingBooks, setPendingBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(emptyBilingual);
  const [author, setAuthor] = useState(emptyBilingual);
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState(emptyBilingual);
  const [description, setDescription] = useState(emptyBilingual);
  const [basePrice, setBasePrice] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [categoryId, setCategoryId] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    dispatch(getCategories({ active: true }));
  }, [dispatch]);

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

  const approvalBadge = (status?: string) => {
    if (status === "approved") return <Badge className="bg-emerald-600">Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const resetForm = () => {
    setName(emptyBilingual);
    setAuthor(emptyBilingual);
    setSlug("");
    setShortDescription(emptyBilingual);
    setDescription(emptyBilingual);
    setBasePrice("");
    setCurrency("SAR");
    setCategoryId("");
    setCoverFile(null);
    setPdfFile(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.ar.trim() && !name.en.trim()) {
      toast.error("Book title is required in at least one language");
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      toast.error("Book price must be greater than zero");
      return;
    }
    if (!pdfFile) {
      toast.error("Please upload the PDF file");
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("name", JSON.stringify(name));
      data.append("author", JSON.stringify(author));
      data.append("slug", slug);
      data.append("shortDescription", JSON.stringify(shortDescription));
      data.append("description", JSON.stringify(description));
      data.append("basePrice", basePrice);
      data.append("currency", currency);
      if (categoryId) data.append("categoryId", categoryId);
      if (coverFile) data.append("cover", coverFile);
      data.append("pdf", pdfFile);

      await bookService.createBook(data);
      toast.success(
        isAdmin
          ? "Book uploaded and published"
          : "Book uploaded successfully and sent for admin approval"
      );
      resetForm();
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload book");
    } finally {
      setSaving(false);
    }
  };

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

  const pendingCount = useMemo(
    () => pendingBooks.filter((book) => book.approvalStatus === "pending").length,
    [pendingBooks]
  );

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage digital books (PDF)
          </p>
        </div>
        {isAdmin && (
          <Badge variant="outline" className="text-sm">
            Pending approvals: {pendingCount}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Book</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Title (AR)</Label>
              <Input
                value={name.ar}
                onChange={(e) => setName((prev) => ({ ...prev, ar: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Title (EN)</Label>
              <Input
                value={name.en}
                onChange={(e) => setName((prev) => ({ ...prev, en: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Author (AR)</Label>
              <Input
                value={author.ar}
                onChange={(e) => setAuthor((prev) => ({ ...prev, ar: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Author (EN)</Label>
              <Input
                value={author.en}
                onChange={(e) => setAuthor((prev) => ({ ...prev, en: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {getLocalizedText(category.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EGP">EGP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Short Description</Label>
              <Textarea
                placeholder="Arabic short description"
                value={shortDescription.ar}
                onChange={(e) =>
                  setShortDescription((prev) => ({ ...prev, ar: e.target.value }))
                }
              />
              <Textarea
                placeholder="English short description"
                value={shortDescription.en}
                onChange={(e) =>
                  setShortDescription((prev) => ({ ...prev, en: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Arabic description"
                value={description.ar}
                onChange={(e) =>
                  setDescription((prev) => ({ ...prev, ar: e.target.value }))
                }
              />
              <Textarea
                placeholder="English description"
                value={description.en}
                onChange={(e) =>
                  setDescription((prev) => ({ ...prev, en: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>PDF File</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">Max file size: 100MB</p>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Book
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : pendingBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending books.</p>
            ) : (
              <div className="space-y-3">
                {pendingBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-semibold">{getLocalizedText(book.name, locale)}</p>
                      <p className="text-xs text-muted-foreground">
                        by {getLocalizedText(book.createdBy?.fullName, locale) || "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {approvalBadge(book.approvalStatus)}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "All Books" : "My Books"}</CardTitle>
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
                      <p className="text-xs text-red-600 mt-1">
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

