"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCourseBySlug } from "@/store/services/courseService";
import { addCourseToCart, openCart } from "@/store/slices/cartSlice";

export default function LegacyCourseCheckoutRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const locale = (params?.locale as string) || "ar";
  const slug = (params?.slug as string) || "";
  const { currentCourse, isLoading } = useAppSelector((state) => state.courses);
  const handledRef = useRef(false);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!slug) return;
    requestedRef.current = true;
    dispatch(getCourseBySlug(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (handledRef.current || isLoading) return;
    if (!currentCourse || currentCourse.slug !== slug) return;

    handledRef.current = true;

    if (currentCourse.accessType !== "paid") {
      router.replace(`/${locale}/courses/${slug}`);
      return;
    }

    const courseId = (currentCourse.id || currentCourse._id) as string | undefined;
    if (!courseId) {
      router.replace(`/${locale}/courses/${slug}`);
      return;
    }

    dispatch(
      addCourseToCart({
        course: {
          id: courseId,
          _id: currentCourse._id,
          title: currentCourse.title,
          slug: currentCourse.slug,
          shortDescription: currentCourse.shortDescription,
          thumbnail: currentCourse.thumbnail,
          accessType: currentCourse.accessType,
          price: currentCourse.price,
          currency: currentCourse.currency,
        },
        quantity: 1,
      })
    );

    toast.success("Course added to cart.");
    dispatch(openCart());
    router.replace(`/${locale}/courses/${slug}`);
  }, [currentCourse, dispatch, isLoading, locale, router, slug]);

  useEffect(() => {
    if (handledRef.current || isLoading) return;
    if (!requestedRef.current) return;
    if (!slug) {
      handledRef.current = true;
      router.replace(`/${locale}/courses`);
      return;
    }
    if (!currentCourse) {
      handledRef.current = true;
      router.replace(`/${locale}/courses`);
    }
  }, [currentCourse, isLoading, locale, router, slug]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Redirecting to cart checkout...</span>
      </div>
    </div>
  );
}
