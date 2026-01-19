"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Download, RefreshCw } from "lucide-react";

interface DateFilterProps {
  datePreset: string;
  onPresetChange: (preset: string) => void;
  customStartDate: string;
  customEndDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApplyCustomDate: () => void;
  onExport: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  isRtl: boolean;
}

export function DateFilter({
  datePreset,
  onPresetChange,
  customStartDate,
  customEndDate,
  onStartDateChange,
  onEndDateChange,
  onApplyCustomDate,
  onExport,
  onRefresh,
  refreshing,
  isRtl,
}: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date Preset */}
      <Select value={datePreset} onValueChange={onPresetChange}>
        <SelectTrigger className="w-[140px]">
          <Calendar className="h-4 w-4 me-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">{isRtl ? "7 أيام" : "7 days"}</SelectItem>
          <SelectItem value="30days">{isRtl ? "30 يوم" : "30 days"}</SelectItem>
          <SelectItem value="90days">{isRtl ? "90 يوم" : "90 days"}</SelectItem>
          <SelectItem value="year">{isRtl ? "السنة" : "Year"}</SelectItem>
          <SelectItem value="custom">{isRtl ? "مخصص" : "Custom"}</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Date Inputs */}
      {datePreset === "custom" && (
        <>
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={customEndDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-[140px]"
          />
          <Button
            size="sm"
            onClick={onApplyCustomDate}
            disabled={!customStartDate || !customEndDate}
          >
            {isRtl ? "تطبيق" : "Apply"}
          </Button>
        </>
      )}

      {/* Export CSV */}
      <Button
        variant="outline"
        size="icon"
        onClick={onExport}
        title="Export CSV"
      >
        <Download className="h-4 w-4" />
      </Button>

      {/* Refresh */}
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={refreshing}
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
