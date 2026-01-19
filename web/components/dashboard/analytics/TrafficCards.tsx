"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Monitor, Smartphone, Tablet } from "lucide-react";

interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

interface Device {
  device: string;
  sessions: number;
  users: number;
}

interface Browser {
  browser: string;
  sessions: number;
}

interface TrafficSourcesCardProps {
  trafficSources: TrafficSource[];
  isRtl: boolean;
}

interface DevicesCardProps {
  devices: Device[];
  browsers: Browser[];
  totalSessions: number;
  isRtl: boolean;
}

export function TrafficSourcesCard({
  trafficSources,
  isRtl,
}: TrafficSourcesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {isRtl ? "مصادر الزيارات" : "Traffic Sources"}
        </CardTitle>
        <CardDescription>
          {isRtl ? "من أين يأتي الزوار" : "Where visitors come from"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRtl ? "المصدر" : "Source"}</TableHead>
              <TableHead>{isRtl ? "الوسيط" : "Medium"}</TableHead>
              <TableHead className="text-right">
                {isRtl ? "جلسات" : "Sessions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trafficSources.length > 0 ? (
              trafficSources.map((source, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{source.source}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{source.medium}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {source.sessions}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  {isRtl ? "لا توجد بيانات" : "No data"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function getDeviceIcon(device: string) {
  switch (device.toLowerCase()) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "desktop":
      return <Monitor className="h-4 w-4" />;
    case "tablet":
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

function formatPercentage(value: number, total: number) {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function DevicesCard({
  devices,
  browsers,
  totalSessions,
  isRtl,
}: DevicesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          {isRtl ? "الأجهزة والمتصفحات" : "Devices & Browsers"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Devices */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            {isRtl ? "الأجهزة" : "Devices"}
          </Label>
          <div className="space-y-3">
            {devices.map((device, i) => (
              <div key={i} className="flex items-center gap-3">
                {getDeviceIcon(device.device)}
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{device.device}</span>
                    <span className="text-muted-foreground">
                      {formatPercentage(device.sessions, totalSessions)}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: formatPercentage(device.sessions, totalSessions),
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browsers */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            {isRtl ? "المتصفحات" : "Browsers"}
          </Label>
          <div className="flex flex-wrap gap-2">
            {browsers.map((browser, i) => (
              <Badge key={i} variant="outline" className="px-3 py-1">
                {browser.browser}: {browser.sessions}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
