"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import AccountClient from "./AccountClient";
import { getUserPaymentHistoryThunk } from "@/store/services/paymentService";

import { getPublicWebsiteSettingsThunk } from "@/store/services/settingsService";
import { getEnrolledCourses } from "@/store/services/courseService";
import { getMySubscriptions } from "@/store/services/studentMemberService";
import { getMyQuizzes } from "@/store/services/quizService";
import { Suspense } from "react";

export default function AccountPage() {
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { payments, isLoading: paymentsLoading } = useSelector(
    (state: RootState) => state.payments
  );

  const { enrolledCourses, isLoading: coursesLoading } = useSelector(
    (state: RootState) => state.courses
  );
  const { mySubscriptions, isLoading: subscriptionsLoading } = useSelector(
    (state: RootState) => state.studentMembers
  );
  const { quizzes, isLoading: quizzesLoading } = useSelector(
    (state: RootState) => state.quizzes
  );
  const { publicSettings, isLoading: settingsLoading } = useSelector(
    (state: RootState) => state.settings
  );
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Fetch public settings if not already loaded
    if (!publicSettings) {
      dispatch(getPublicWebsiteSettingsThunk());
    }

    // Fetch user data if logged in
    if (user?.token && !hasFetched) {
      dispatch(getUserPaymentHistoryThunk());

      dispatch(getEnrolledCourses());
      dispatch(getMySubscriptions());
      dispatch(getMyQuizzes());
      setHasFetched(true);
    }
  }, [user, dispatch, publicSettings, hasFetched]);

  const isInitialLoading =
    (paymentsLoading || coursesLoading || settingsLoading || subscriptionsLoading || quizzesLoading) && !hasFetched;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <AccountClient
        initialOrders={payments || []}

        initialEnrolledCourses={enrolledCourses || []}
        initialSubscriptions={mySubscriptions || []}
        initialQuizzes={quizzes || []}
        settings={publicSettings || {}}
        locale={locale}
      />
    </Suspense>
  );
}
