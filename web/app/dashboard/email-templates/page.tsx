"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import {
  getEmailTemplates,
  saveEmailTemplate,
  EmailTemplate,
} from "@/store/services/emailTemplateService";
import { resetEmailTemplateStatus } from "@/store/slices/emailTemplateSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Edit, Save, Plus, X, Info } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmailTemplatesPage() {
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const { templates, isLoading, error, success } = useAppSelector(
    (state) => state.emailTemplates
  );

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});

  useEffect(() => {
    dispatch(getEmailTemplates());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success(t("admin.emailTemplates.messages.saveSuccess"));
      setIsEditDialogOpen(false);
      dispatch(resetEmailTemplateStatus());
    }
    if (error) {
      toast.error(error);
      dispatch(resetEmailTemplateStatus());
    }
  }, [success, error, dispatch, t]);

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({ ...template });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    dispatch(saveEmailTemplate(formData));
  };

  const handleStatusToggle = (template: EmailTemplate) => {
    dispatch(
      saveEmailTemplate({
        name: template.name,
        isActive: !template.isActive,
      })
    );
  };

  return (
    <div
      className={`flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6 ${isRtl ? "text-right" : ""}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("admin.emailTemplates.title")}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.emailTemplates.listTitle")}</CardTitle>
          <CardDescription>
            {t("admin.emailTemplates.listDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.emailTemplates.table.name")}</TableHead>
                <TableHead>{t("admin.emailTemplates.table.subject")}</TableHead>
                <TableHead>{t("admin.emailTemplates.table.type")}</TableHead>
                <TableHead>{t("admin.emailTemplates.table.status")}</TableHead>
                <TableHead className={isRtl ? "text-left" : "text-right"}>
                  {t("admin.emailTemplates.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("admin.emailTemplates.messages.noTemplates")}
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      {isRtl ? template.subject.ar : template.subject.en}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.isActive ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleStatusToggle(template)}
                      >
                        {template.isActive
                          ? t("common.active")
                          : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className={isRtl ? "text-left" : "text-right"}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("admin.emailTemplates.edit.title")}: {formData.name}
            </DialogTitle>
            <DialogDescription>
              {t("admin.emailTemplates.edit.description")}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="ar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ar">{t("common.arabic")}</TabsTrigger>
              <TabsTrigger value="en">{t("common.english")}</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 space-y-4">
              <TabsContent value="ar" className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("admin.emailTemplates.edit.subjectAr")}</Label>
                  <Input
                    value={formData.subject?.ar || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subject: { ...formData.subject!, ar: e.target.value },
                      })
                    }
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.emailTemplates.edit.contentAr")}</Label>
                  <Textarea
                    value={formData.content?.ar || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: { ...formData.content!, ar: e.target.value },
                      })
                    }
                    className="min-h-[300px] font-mono"
                    dir="rtl"
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("admin.emailTemplates.edit.subjectEn")}</Label>
                  <Input
                    value={formData.subject?.en || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subject: { ...formData.subject!, en: e.target.value },
                      })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.emailTemplates.edit.contentEn")}</Label>
                  <Textarea
                    value={formData.content?.en || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: { ...formData.content!, en: e.target.value },
                      })
                    }
                    className="min-h-[300px] font-mono"
                    dir="ltr"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Info className="h-4 w-4" />
              {t("admin.emailTemplates.edit.variables")}
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.variables?.map((v) => (
                <Badge key={v.name} variant="secondary" className="font-mono">
                  {`{{${v.name}}}`}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("admin.emailTemplates.edit.variablesHint")}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
