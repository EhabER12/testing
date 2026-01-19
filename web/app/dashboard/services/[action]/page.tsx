"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createService,
  updateService,
  getServiceById,
  resetCurrentService,
} from "@/store/slices/serviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { toast } from "sonner";

// Import refactored components
import { LanguageSwitcher } from "@/components/dashboard/common/LanguageSwitcher";
import { ServiceBasicInfo } from "@/components/dashboard/services/ServiceBasicInfo";
import { ServicePricingTiers } from "@/components/dashboard/services/ServicePricingTiers";
import { ServiceStats } from "@/components/dashboard/services/ServiceStats";
import { ServiceFeatures } from "@/components/dashboard/services/ServiceFeatures";
import { ServiceImageGallery } from "@/components/dashboard/services/ServiceImageGallery";

interface FeatureItem {
  icon: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
}

interface StatItem {
  value: string;
  label: { ar: string; en: string };
  icon: string;
}

interface PricingTierItem {
  name: { ar: string; en: string };
  price: number | null;
  currency: string;
  description: { ar: string; en: string };
  features: { ar: string[]; en: string[] };
  isPopular: boolean;
}

export default function ServiceFormPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { locale, t } = useAdminLocale();

  const action = params?.action as string;
  const idParam = params?.id;
  const serviceId =
    action === "edit" && idParam
      ? ((Array.isArray(idParam) ? idParam[0] : idParam) as string)
      : null;
  const isEdit = action === "edit" && !!serviceId;

  const { currentService, loading } = useAppSelector((state) => state.services);

  // Form language state
  const [formLang, setFormLang] = useState<"ar" | "en">("ar");

  // Form state
  const [formData, setFormData] = useState({
    title: { ar: "", en: "" },
    slug: "",
    shortDescription: { ar: "", en: "" },
    description: { ar: "", en: "" },
    icon: "code",
    category: "other",
    pricingType: "quote",
    startingPrice: "",
    isActive: true,
    isFeatured: false,
    order: 0,
  });

  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTierItem[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<
    Array<{ url: string; alt: { ar: string; en: string } }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  // Sync formLang with admin locale
  useEffect(() => {
    if (locale === "ar" || locale === "en") {
      setFormLang(locale);
    }
  }, [locale]);

  // Load service data if editing
  useEffect(() => {
    if (isEdit && serviceId) {
      dispatch(getServiceById(serviceId));
    }
    return () => {
      dispatch(resetCurrentService());
    };
  }, [isEdit, serviceId, dispatch]);

  // Populate form when service is loaded
  useEffect(() => {
    if (isEdit && currentService) {
      setFormData({
        title: currentService.title || { ar: "", en: "" },
        slug: currentService.slug || "",
        shortDescription: currentService.shortDescription || { ar: "", en: "" },
        description: currentService.description || { ar: "", en: "" },
        icon: currentService.icon || "code",
        category: currentService.category || "other",
        pricingType: currentService.pricingType || "quote",
        startingPrice: currentService.startingPrice?.toString() || "",
        isActive: currentService.isActive ?? true,
        isFeatured: currentService.isFeatured ?? false,
        order: currentService.order || 0,
      });
      setFeatures(currentService.features || []);
      setStats(currentService.stats || []);
      // Transform pricingTiers features from string[] to {ar, en} format if needed
      const transformedTiers = (currentService.pricingTiers || []).map(
        (tier: any) => ({
          ...tier,
          features: Array.isArray(tier.features)
            ? { ar: tier.features, en: tier.features }
            : tier.features || { ar: [], en: [] },
        })
      );
      setPricingTiers(transformedTiers);
      if (currentService.coverImage) {
        setCoverImagePreview(currentService.coverImage);
      }
      if (currentService.gallery) {
        setExistingGallery(currentService.gallery);
      }
    }
  }, [isEdit, currentService]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Add basic fields
      formDataToSend.append("title", JSON.stringify(formData.title));
      formDataToSend.append("slug", formData.slug);
      formDataToSend.append(
        "shortDescription",
        JSON.stringify(formData.shortDescription)
      );
      formDataToSend.append(
        "description",
        JSON.stringify(formData.description)
      );
      formDataToSend.append("icon", formData.icon);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("pricingType", formData.pricingType);
      formDataToSend.append("startingPrice", formData.startingPrice);
      formDataToSend.append("isActive", formData.isActive.toString());
      formDataToSend.append("isFeatured", formData.isFeatured.toString());
      formDataToSend.append("order", formData.order.toString());

      // Add features, stats, and pricing tiers
      formDataToSend.append("features", JSON.stringify(features));
      formDataToSend.append("stats", JSON.stringify(stats));
      formDataToSend.append("pricingTiers", JSON.stringify(pricingTiers));

      // Add cover image
      if (coverImage) {
        formDataToSend.append("coverImage", coverImage);
      }

      // Add gallery files
      galleryFiles.forEach((file) => {
        formDataToSend.append("gallery", file);
      });

      // Add existing gallery (for update - to preserve unchanged images)
      if (isEdit && existingGallery.length > 0) {
        formDataToSend.append(
          "existingGallery",
          JSON.stringify(existingGallery)
        );
      }

      if (isEdit && serviceId) {
        await dispatch(
          updateService({ id: serviceId, data: formDataToSend })
        ).unwrap();
        toast.success(t("admin.services.serviceUpdated"));
      } else {
        await dispatch(createService(formDataToSend)).unwrap();
        toast.success(t("admin.services.serviceCreated"));
      }

      router.push("/dashboard/services");
    } catch (error: any) {
      toast.error(error || t("admin.services.serviceFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className="p-6 max-w-4xl mx-auto"
      dir={formLang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/services">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit
                ? t("admin.services.editService")
                : t("admin.services.createNew")}
            </h1>
          </div>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <ServiceBasicInfo
          formData={formData}
          setFormData={setFormData}
          formLang={formLang}
        />

        {/* Pricing Tiers Section (shown when pricingType = "tiers") */}
        {formData.pricingType === "tiers" && (
          <ServicePricingTiers
            pricingTiers={pricingTiers}
            setPricingTiers={setPricingTiers}
            formLang={formLang}
          />
        )}

        {/* Image Gallery Section */}
        <ServiceImageGallery
          coverImage={coverImage}
          setCoverImage={setCoverImage}
          coverImagePreview={coverImagePreview}
          setCoverImagePreview={setCoverImagePreview}
          galleryFiles={galleryFiles}
          setGalleryFiles={setGalleryFiles}
          galleryPreviews={galleryPreviews}
          setGalleryPreviews={setGalleryPreviews}
          existingGallery={existingGallery}
          setExistingGallery={setExistingGallery}
          formLang={formLang}
        />

        {/* Stats Section */}
        <ServiceStats stats={stats} setStats={setStats} formLang={formLang} />

        {/* Features Section */}
        <ServiceFeatures
          features={features}
          setFeatures={setFeatures}
          formLang={formLang}
        />

        {/* Submit */}
        <div className="sticky bottom-0 z-10 flex justify-end gap-4 bg-background p-4 border-t mt-6 -mx-6 px-6 shadow-sm">
          <Link href="/dashboard/services">
            <Button type="button" variant="outline">
              {t("common.cancel")}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 bg-secondary-blue hover:bg-secondary-blue/90 text-white min-w-[150px]"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t("admin.services.saveService")}
          </Button>
        </div>
      </form>
    </div>
  );
}
