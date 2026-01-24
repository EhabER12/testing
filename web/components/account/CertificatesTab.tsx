"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { claimCertificate, getMyCertificatesEligibility, downloadCertificate } from "@/store/services/certificateService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Download, Award, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useEffect } from "react";

interface CertificatesTabProps {
  locale: string;
}

export default function CertificatesTab({ locale }: CertificatesTabProps) {
  const dispatch = useAppDispatch();
  const { eligibility, isLoading } = useAppSelector((state) => state.certificates);
  const isArabic = locale === "ar";

  useEffect(() => {
    dispatch(getMyCertificatesEligibility());
  }, [dispatch]);

  const getTextValue = (obj: any) => {
    if (!obj) return "";
    return isArabic ? obj.ar || obj.en : obj.en || obj.ar;
  };

  const handleClaim = async (courseId: string) => {
    try {
      await dispatch(claimCertificate(courseId)).unwrap();
      toast.success(isArabic ? "تم استلام الشهادة بنجاح!" : "Certificate claimed successfully!");
    } catch (error: any) {
      toast.error(error || (isArabic ? "فشل استلام الشهادة" : "Failed to claim certificate"));
    }
  };

  const handleDownload = async (certificateNumber: string) => {
    try {
      // Use public download endpoint with certificate number
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const downloadUrl = `${apiUrl}/certificates/download/${certificateNumber}`;
      
      // Open in new tab to trigger download
      window.open(downloadUrl, '_blank');
      
      toast.success(isArabic ? "جاري تحميل الشهادة..." : "Downloading certificate...");
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(isArabic ? "فشل تحميل الشهادة" : "Failed to download certificate");
    }
  };

  if (isLoading && eligibility.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-genoun-green" />
      </div>
    );
  }

  if (eligibility.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="bg-gray-100 p-4 rounded-full">
            <Award className="h-12 w-12 text-gray-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-xl">{isArabic ? "لا توجد شهادات متاحة" : "No certificates available"}</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {isArabic 
                ? "ابدأ في تعلم الدورات التدريبية وأكملها للحصول على شهاداتك هنا." 
                : "Start learning and complete courses to earn your certificates here."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {eligibility.map((item) => (
        <Card key={item.courseId} className="overflow-hidden border-t-4 border-t-genoun-green">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row h-full">
              {/* Thumbnail */}
              <div className="relative w-full sm:w-40 h-32 sm:h-auto shrink-0 bg-gray-100">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={getTextValue(item.courseTitle)}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Trophy className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  {item.status === "claimed" ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {isArabic ? "تم الاستلام" : "Claimed"}
                    </Badge>
                  ) : item.status === "eligible" ? (
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      {isArabic ? "مؤهل" : "Eligible"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      {isArabic ? "مغلق" : "Locked"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-base line-clamp-2 leading-snug">
                    {getTextValue(item.courseTitle)}
                  </h3>
                  {item.status === "claimed" ? (
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "تاريخ الإصدار: " : "Issued: "}
                      {item.issuedAt ? format(new Date(item.issuedAt), "PPP", { locale: isArabic ? ar : undefined }) : "-"}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-genoun-green transition-all" 
                            style={{ width: `${item.progress || 0}%` }}
                          />
                       </div>
                       <span className="text-[10px] font-medium whitespace-nowrap">
                          {Math.round(item.progress || 0)}%
                       </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "claimed" ? (
                    <Button 
                      className="w-full bg-genoun-green hover:bg-genoun-green/90 text-white" 
                      size="sm"
                      onClick={() => item.certificateNumber && handleDownload(item.certificateNumber)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isArabic ? "تحميل الشهادة" : "Download PDF"}
                    </Button>
                  ) : item.status === "eligible" ? (
                    <Button 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" 
                      size="sm"
                      onClick={() => handleClaim(item.courseId)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2" />}
                      {isArabic ? "استلام الشهادة" : "Claim Certificate"}
                    </Button>
                  ) : (
                    <div className="w-full p-2 bg-gray-50 rounded border border-gray-100 flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {isArabic 
                          ? `متطلبات الشهادة لم تكتمل بعد: ${item.reason === "Course not completed" ? "يجب إكمال الدورة بنسبة 100%" : "يجب اجتياز الاختبار النهائي"}`
                          : `Requirements not met: ${item.reason === "Course not completed" ? "Must complete course" : "Must pass final exam"}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Star(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
