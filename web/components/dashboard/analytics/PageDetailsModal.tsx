"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { PageDetails } from "@/store/services/dashboardService";
import { getCountryFlag } from "./TopCountriesCard";

interface PageDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  pageDetails: PageDetails | null;
  isRtl: boolean;
  formatDuration: (seconds: number | undefined) => string;
}

export function PageDetailsModal({
  open,
  onOpenChange,
  loading,
  pageDetails,
  isRtl,
  formatDuration,
}: PageDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isRtl ? "تفاصيل الصفحة" : "Page Details"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : pageDetails ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground truncate">
              {pageDetails.path}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "المشاهدات" : "Views"}
                </p>
                <p className="text-xl font-bold">{pageDetails.views}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "المستخدمون" : "Users"}
                </p>
                <p className="text-xl font-bold">{pageDetails.users}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "متوسط المدة" : "Avg Duration"}
                </p>
                <p className="text-xl font-bold">
                  {formatDuration(pageDetails.avgDuration)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "معدل الارتداد" : "Bounce Rate"}
                </p>
                <p className="text-xl font-bold">
                  {pageDetails.bounceRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Countries */}
            {pageDetails.countries.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {isRtl ? "الدول" : "Countries"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {pageDetails.countries.map((c, i) => (
                    <Badge key={i} variant="outline">
                      {getCountryFlag(c.country)} {c.country}: {c.views}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Devices */}
            {pageDetails.devices.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {isRtl ? "الأجهزة" : "Devices"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {pageDetails.devices.map((d, i) => (
                    <Badge key={i} variant="secondary">
                      {d.device}: {d.views}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isRtl ? "لا توجد بيانات" : "No data available"}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
