"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getQuiz, getQuizStatistics, getAllQuizAttempts } from "@/store/services/quizService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ChevronLeft, Users, Trophy, Target, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function QuizStatsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();

  const { currentQuiz, statistics, attempts, isLoading } = useAppSelector(
    (state) => state.quizzes
  );

  useEffect(() => {
    if (id) {
      dispatch(getQuiz(id as string));
      dispatch(getQuizStatistics(id as string));
      dispatch(getAllQuizAttempts({ quizId: id as string }));
    }
  }, [dispatch, id]);

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  if (isLoading || !currentQuiz || !statistics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  const pieData = [
    { name: isRtl ? "ناجح" : "Passed", value: statistics.totalPasses, color: "#22c55e" },
    { name: isRtl ? "راسب" : "Failed", value: statistics.totalFails, color: "#ef4444" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{getTextValue(currentQuiz.title)}</h1>
          <p className="text-muted-foreground">{isRtl ? "إحصائيات ونتائج الاختبار" : "Quiz statistics and results"}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isRtl ? "إجمالي المحاولات" : "Total Attempts"}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAttempts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isRtl ? "متوسط الدرجة" : "Average Score"}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(statistics.averageScore)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isRtl ? "نسبة النجاح" : "Pass Rate"}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(statistics.passRate)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isRtl ? "أعلى درجة" : "Highest Score"}</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.highestScore}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Question Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "تحليل الأسئلة" : "Question Analytics"}</CardTitle>
          <CardDescription>{isRtl ? "نسبة الإجابات الصحيحة لكل سؤال" : "Success rate for each question"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {statistics.questionStats?.map((qStat: any, index: number) => (
              <div key={qStat.questionId} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{index + 1}. {getTextValue(qStat.questionText)}</span>
                  <span className="font-bold">{Math.round(qStat.correctRate)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${qStat.correctRate > 70 ? 'bg-green-500' : qStat.correctRate > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${qStat.correctRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isRtl ? `تمت الإجابة عليه ${qStat.totalAttempts} مرة` : `Answered ${qStat.totalAttempts} times`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pass/Fail Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{isRtl ? "توزيع النتائج" : "Results Distribution"}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-sm">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attempts Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isRtl ? "أحدث المحاولات" : "Recent Attempts"}</CardTitle>
            <CardDescription>{isRtl ? "قائمة بآخر المحاولات التي قام بها الطلاب" : "List of the latest attempts by students"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "الطالب" : "Student"}</TableHead>
                  <TableHead>{isRtl ? "الدرجة" : "Score"}</TableHead>
                  <TableHead>{isRtl ? "النتيجة" : "Result"}</TableHead>
                  <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.length > 0 ? (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.id || attempt._id}>
                      <TableCell className="font-medium">
                        {attempt.userId?.fullName?.ar || attempt.userId?.fullName?.en || attempt.userId?.email || "Unknown"}
                      </TableCell>
                      <TableCell>{attempt.score}%</TableCell>
                      <TableCell>
                        <Badge className={attempt.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} variant="outline">
                          {attempt.passed ? (isRtl ? "ناجح" : "Passed") : (isRtl ? "راسب" : "Failed")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(attempt.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {isRtl ? "لا توجد محاولات بعد" : "No attempts yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
