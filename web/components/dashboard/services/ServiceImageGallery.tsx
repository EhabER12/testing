"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

interface GalleryImage {
  url: string;
  alt: { ar: string; en: string };
}

interface ServiceImageGalleryProps {
  coverImage: File | null;
  setCoverImage: (file: File | null) => void;
  coverImagePreview: string;
  setCoverImagePreview: (url: string) => void;
  galleryFiles: File[];
  setGalleryFiles: (files: File[]) => void;
  galleryPreviews: string[];
  setGalleryPreviews: (urls: string[]) => void;
  existingGallery: GalleryImage[];
  setExistingGallery: (gallery: GalleryImage[]) => void;
  formLang: "ar" | "en";
}

export function ServiceImageGallery({
  coverImage,
  setCoverImage,
  coverImagePreview,
  setCoverImagePreview,
  galleryFiles,
  setGalleryFiles,
  galleryPreviews,
  setGalleryPreviews,
  existingGallery,
  setExistingGallery,
  formLang,
}: ServiceImageGalleryProps) {
  const { t } = useAdminLocale();

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles([...galleryFiles, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    }
  };

  const removeGalleryPreview = (index: number) => {
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (url: string) => {
    setExistingGallery(existingGallery.filter((img) => img.url !== url));
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
        {formLang === "ar" ? "الصور" : "Images"}
      </h2>

      {/* Cover Image */}
      <div>
        <Label>{t("admin.services.coverImage")}</Label>
        <div className="mt-2 flex items-center gap-4">
          {coverImagePreview ? (
            <img
              src={coverImagePreview}
              alt="Cover"
              className="w-32 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Gallery Images */}
      <div>
        <Label>{t("admin.services.galleryImages")}</Label>
        <p className="text-sm text-gray-500 mb-2">
          {t("admin.services.galleryHint")}
        </p>

        {/* Existing Gallery */}
        {existingGallery.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t("admin.services.currentImages")}
            </p>
            <div className="flex flex-wrap gap-3">
              {existingGallery.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.url}
                    alt={img.alt?.ar || img.alt?.en || "Gallery"}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingGalleryImage(img.url)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Gallery Previews */}
        {galleryPreviews.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t("admin.services.newImages")}
            </p>
            <div className="flex flex-wrap gap-3">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`New ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-green-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryPreview(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Input */}
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryChange}
          className="max-w-xs"
        />
      </div>
    </div>
  );
}
