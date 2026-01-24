"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Award, Calendar, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearPublicCertificates } from "@/store/slices/certificateSlice";
import { getCertificatesByEmail } from "@/store/services/certificateService";
import Link from "next/link";

export default function CertificatesPage() {
  const t = useTranslations("certificates");
  const dispatch = useAppDispatch();
  const { publicCertificates, publicUser, isLoading, error } = useAppSelector(
    (state) => state.certificates
  );

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitted(true);
    await dispatch(getCertificatesByEmail(email));
  };

  const handleReset = () => {
    setEmail("");
    setSubmitted(false);
    dispatch(clearPublicCertificates());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("downloadTitle")}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("downloadDescription")}
          </p>
        </div>

        {!submitted ? (
          <Card className="max-w-md mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Award className="h-6 w-6 text-blue-600" />
                {t("enterEmail")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg">
                    {t("emailLabel")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-lg py-6"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("searchCertificates")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription className="text-center py-4">
                  {error}
                </AlertDescription>
                <div className="text-center mt-4">
                  <Button onClick={handleReset} variant="outline">
                    {t("tryAgain")}
                  </Button>
                </div>
              </Alert>
            ) : publicCertificates && publicCertificates.length > 0 ? (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      {t("studentInfo")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{t("name")}</p>
                        <p className="font-medium">
                          {publicUser?.fullName?.ar || publicUser?.fullName?.en || publicUser?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("email")}</p>
                        <p className="font-medium">{publicUser?.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {t("foundCertificates", { count: publicCertificates.length })}
                  </h2>
                  <p className="text-gray-600">
                    {t("selectToDownload")}
                  </p>
                </div>

                <div className="grid gap-6">
                  {publicCertificates.map((certificate: any) => (
                    <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            {certificate.course?.title?.ar || certificate.course?.title?.en}
                          </span>
                          <span className="text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            {certificate.certificateNumber}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(certificate.issuedAt)}</span>
                          </div>
                          
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/certificates/download/${certificate.certificateNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="no-underline"
                          >
                            <Button className="gap-2">
                              <Download className="h-4 w-4" />
                              {t("downloadCertificate")}
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center pt-6">
                  <Button onClick={handleReset} variant="outline" size="lg">
                    {t("searchAnother")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}