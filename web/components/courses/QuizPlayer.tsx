"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getQuiz,
  submitQuizAttempt,
  getUserBestAttempt,
  Quiz,
  QuizAttempt,
} from "@/store/services/quizService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuizPlayerProps {
  quizId: string;
  onComplete?: (attempt: QuizAttempt) => void;
  locale: string;
}

export default function QuizPlayer({ quizId, onComplete, locale }: QuizPlayerProps) {
  const dispatch = useAppDispatch();
  const isRtl = locale === "ar";
  
  const { currentQuiz, bestAttempt, lastAttempt, isLoading, isSubmitting } = useAppSelector(
    (state) => state.quizzes
  );

  const [gameState, setGameState] = useState<"start" | "playing" | "results">("start");
  const [currentQuestionIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (quizId) {
      dispatch(getQuiz(quizId));
      dispatch(getUserBestAttempt(quizId));
    }
  }, [dispatch, quizId]);

  useEffect(() => {
    let timer: any;
    if (gameState === "playing" && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0 && gameState === "playing") {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const handleStart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setGameState("playing");
    if (currentQuiz?.timeLimit) {
      setTimeLeft(currentQuiz.timeLimit * 60);
    } else {
      setTimeLeft(null);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuiz) return;

    const formattedAnswers = currentQuiz.questions.map((q) => {
      const qId = (q as any).id || q._id;
      return {
        questionId: qId,
        chosenAnswer: answers[qId] ?? -1,
      };
    });

    try {
      const attempt = await dispatch(
        submitQuizAttempt({ quizId: (currentQuiz.id || currentQuiz._id) as string, answers: formattedAnswers })
      ).unwrap();
      setGameState("results");
      if (onComplete) onComplete(attempt);
    } catch (error: any) {
      if (error.includes("Maximum attempts")) {
        toast.error(isRtl ? "لقد تخطيت الحد المسموح للمحاولات لهذا الاختبار" : "You have reached the maximum number of attempts for this quiz");
      } else {
        toast.error(error || "Failed to submit quiz");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading && !currentQuiz) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  if (!currentQuiz) return null;

  if (gameState === "start") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <CardTitle className="text-2xl">{getTextValue(currentQuiz.title)}</CardTitle>
          <CardDescription>{getTextValue(currentQuiz.description)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">{isRtl ? "الأسئلة" : "Questions"}</p>
              <p className="text-xl font-bold">{currentQuiz.questionsCount}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">{isRtl ? "درجة النجاح" : "Passing Score"}</p>
              <p className="text-xl font-bold text-genoun-green">{currentQuiz.passingScore}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">{isRtl ? "الوقت" : "Time Limit"}</p>
              <p className="text-xl font-bold">
                {currentQuiz.timeLimit ? `${currentQuiz.timeLimit} ${isRtl ? "دقيقة" : "min"}` : (isRtl ? "بلا حدود" : "No limit")}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">{isRtl ? "أفضل درجة" : "Best Score"}</p>
              <p className="text-xl font-bold text-blue-600">
                {bestAttempt ? `${bestAttempt.score}%` : "-"}
              </p>
            </div>
          </div>

          {currentQuiz.attemptsAllowed && (bestAttempt?.attemptNumber || 0) >= currentQuiz.attemptsAllowed ? (
            <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-800 border border-red-100">
              <AlertCircle className="h-5 w-5" />
              <p>{isRtl ? "لقد استنفدت جميع المحاولات المتاحة لهذا الاختبار" : "You have reached the maximum number of attempts for this quiz"}</p>
            </div>
          ) : (
            <Button onClick={handleStart} className="w-full bg-genoun-green hover:bg-genoun-green/90 h-12 text-lg">
              {isRtl ? "ابدأ الاختبار" : "Start Quiz"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (gameState === "playing") {
    const question = currentQuiz.questions[currentQuestionIndex];
    const questionId = (question as any).id || question._id;
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questionsCount) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>{isRtl ? "السؤال" : "Question"} {currentQuestionIndex + 1} / {currentQuiz.questionsCount}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100'}`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {getTextValue(question.questionText)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={answers[questionId]?.toString()} 
              onValueChange={(val) => setAnswers({ ...answers, [questionId]: parseInt(val) })}
              className="space-y-3"
            >
              {question.choices.map((choice, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${answers[questionId] === idx ? 'border-genoun-green bg-genoun-green/5' : ''}`}
                  onClick={() => setAnswers({ ...answers, [questionId]: idx })}
                >
                  <RadioGroupItem value={idx.toString()} id={`q-${idx}`} className={isRtl ? "ml-3" : "mr-3"} />
                  <Label htmlFor={`q-${idx}`} className="flex-1 cursor-pointer text-lg">{getTextValue(choice)}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentIndex(currentQuestionIndex - 1)}
          >
            {isRtl ? <><ChevronRight className="h-4 w-4 ml-2" /> السابق</> : <><ChevronLeft className="h-4 w-4 mr-2" /> Previous</>}
          </Button>

          {currentQuestionIndex === currentQuiz.questionsCount - 1 ? (
            <Button 
              className="bg-genoun-green hover:bg-genoun-green/90 px-8"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              ) : (
                <CheckCircle2 className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              )}
              {isRtl ? "إنهاء الاختبار" : "Finish Quiz"}
            </Button>
          ) : (
            <Button 
              onClick={() => setCurrentIndex(currentQuestionIndex + 1)}
              className="px-8"
            >
              {isRtl ? <>التالي <ChevronLeft className="h-4 w-4 mr-2" /></> : <>Next <ChevronRight className="h-4 w-4 ml-2" /></>}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === "results" && lastAttempt) {
    const passed = lastAttempt.passed;
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          {passed ? (
            <div className="mb-4">
              <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10" />
              </div>
              <CardTitle className="text-3xl text-green-600">{isRtl ? "مبروك! لقد نجحت" : "Congratulations! You Passed"}</CardTitle>
            </div>
          ) : (
            <div className="mb-4">
              <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10" />
              </div>
              <CardTitle className="text-3xl text-red-600">{isRtl ? "للأسف، لم يحالفك الحظ" : "Keep Trying!"}</CardTitle>
            </div>
          )}
          <CardDescription className="text-lg">
            {isRtl ? `درجتك: ${lastAttempt.score}%` : `Your score: ${lastAttempt.score}%`}
            <br />
            {isRtl ? `درجة النجاح المطلوبة: ${currentQuiz.passingScore}%` : `Required score: ${currentQuiz.passingScore}%`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-gray-500">{isRtl ? "الإجابات الصحيحة" : "Correct Answers"}</p>
              <p className="text-2xl font-bold text-green-600">
                {lastAttempt.answers.filter(a => a.isCorrect).length} / {currentQuiz.questionsCount}
              </p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-gray-500">{isRtl ? "النقاط المحتسبة" : "Points Earned"}</p>
              <p className="text-2xl font-bold">
                {lastAttempt.earnedPoints} / {lastAttempt.totalPoints}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {currentQuiz.showCorrectAnswers && (
              <div className="space-y-4 text-left border-t pt-6" dir={isRtl ? "rtl" : "ltr"}>
                <h3 className="font-bold text-lg mb-4">{isRtl ? "مراجعة الإجابات" : "Review Answers"}</h3>
                {currentQuiz.questions.map((q, idx) => {
                  const qId = (q as any).id || q._id;
                  const userAnswer = lastAttempt.answers.find(a => a.questionId === qId);
                  const isCorrect = userAnswer?.isCorrect;
                  return (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" /> : <XCircle className="h-5 w-5 text-red-500 mt-1" />}
                        <div className="flex-1">
                          <p className="font-medium mb-2">{getTextValue(q.questionText)}</p>
                          <p className="text-sm">
                            <span className="font-bold">{isRtl ? "إجابتك:" : "Your answer:"}</span>{" "}
                            {userAnswer?.chosenAnswer !== -1 ? getTextValue(q.choices[userAnswer?.chosenAnswer || 0]) : (isRtl ? "لم تتم الإجابة" : "No answer")}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-700 font-medium mt-1">
                              <span className="font-bold">{isRtl ? "الإجابة الصحيحة:" : "Correct answer:"}</span>{" "}
                              {getTextValue(q.choices[q.correctAnswer])}
                            </p>
                          )}
                          {q.explanation && (getTextValue(q.explanation)) && (
                            <div className="mt-3 p-3 bg-white/50 rounded border text-sm text-gray-600 italic">
                              <span className="font-bold not-italic">{isRtl ? "الشرح:" : "Explanation:"}</span> {getTextValue(q.explanation)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!passed && (!currentQuiz.attemptsAllowed || lastAttempt.attemptNumber < currentQuiz.attemptsAllowed) && (
              <Button onClick={handleStart} variant="outline" className="h-12">
                <RotateCcw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {isRtl ? "إعادة المحاولة" : "Try Again"}
              </Button>
            )}
            <Button onClick={() => setGameState("start")} className="h-12 bg-genoun-green hover:bg-genoun-green/90">
              {isRtl ? "العودة لصفحة الاختبار" : "Back to Overview"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
