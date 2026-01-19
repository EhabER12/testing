"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getMyTasks,
  updateMyTaskStatus,
  EmployeeTask,
} from "@/store/services/employeeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Clock,
  CheckCircle,
  PlayCircle,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

const COLUMNS = [
  { id: "pending", icon: Clock, color: "bg-orange-500" },
  { id: "in_progress", icon: PlayCircle, color: "bg-blue-500" },
  { id: "completed", icon: CheckCircle, color: "bg-green-500" },
] as const;

type ColumnId = "pending" | "in_progress" | "completed";

// Draggable Task Card Component
function DraggableTaskCard({
  task,
  locale,
  t,
  formatDate,
  isOverdue,
  getPriorityColor,
  isDragging,
}: {
  task: EmployeeTask;
  locale: string;
  t: (key: string) => string;
  formatDate: (date: string | undefined) => string;
  isOverdue: (date: string | undefined) => boolean;
  getPriorityColor: (priority: string) => string;
  isDragging?: boolean;
}) {
  const taskId = task._id || task.id;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: taskId,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      {/* Drag Handle + Task Header */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2">
              {locale === "ar"
                ? task.title?.ar || task.title?.en
                : task.title?.en || task.title?.ar}
            </h4>
            <Badge
              variant={getPriorityColor(task.priority) as any}
              className="shrink-0 text-xs"
            >
              {t(
                `admin.employees.priority${
                  task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
                }`
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div
          className={`flex items-center gap-1 text-xs ${
            isOverdue(task.dueDate) && task.status !== "completed"
              ? "text-red-500 font-medium"
              : "text-muted-foreground"
          }`}
        >
          {isOverdue(task.dueDate) && task.status !== "completed" && (
            <AlertTriangle className="h-3 w-3" />
          )}
          <Clock className="h-3 w-3" />
          {formatDate(task.dueDate)}
        </div>
      )}
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  tasks,
  locale,
  t,
  formatDate,
  isOverdue,
  getPriorityColor,
  getColumnTitle,
  isRtl,
  activeTaskId,
}: {
  column: (typeof COLUMNS)[number];
  tasks: EmployeeTask[];
  locale: string;
  t: (key: string) => string;
  formatDate: (date: string | undefined) => string;
  isOverdue: (date: string | undefined) => boolean;
  getPriorityColor: (priority: string) => string;
  getColumnTitle: (id: string) => string;
  isRtl: boolean;
  activeTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  const IconComponent = column.icon;

  return (
    <Card className="flex flex-col">
      <CardHeader className={`${column.color} text-white rounded-t-lg`}>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {getColumnTitle(column.id)}
          </span>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className={`flex-1 pt-4 space-y-3 min-h-[300px] transition-colors ${
          isOver
            ? "bg-primary/10 ring-2 ring-primary ring-inset"
            : "bg-muted/30"
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {t("admin.myTasks.noTasks")}
          </div>
        ) : (
          tasks.map((task) => {
            const taskId = task._id || task.id;
            return (
              <DraggableTaskCard
                key={taskId}
                task={task}
                locale={locale}
                t={t}
                formatDate={formatDate}
                isOverdue={isOverdue}
                getPriorityColor={getPriorityColor}
                isDragging={activeTaskId === taskId}
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default function MyTasksPage() {
  const dispatch = useAppDispatch();
  const { t, locale, isRtl } = useAdminLocale();
  const [activeTask, setActiveTask] = useState<EmployeeTask | null>(null);

  const { tasks, isTasksLoading } = useAppSelector((state) => state.employees);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    dispatch(getMyTasks({}));
  }, [dispatch]);

  const getTasksByStatus = (status: string) => {
    return (tasks || []).filter((task) => task.status === status);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    return format(new Date(date), "d MMM", {
      locale: locale === "ar" ? ar : enUS,
    });
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getColumnTitle = (columnId: string) => {
    switch (columnId) {
      case "pending":
        return t("admin.employees.statusPending");
      case "in_progress":
        return t("admin.employees.statusInProgress");
      case "completed":
        return t("admin.employees.statusCompleted");
      default:
        return columnId;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = (tasks || []).find((t) => (t._id || t.id) === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as ColumnId;

    // Find the task
    const task = (tasks || []).find((t) => (t._id || t.id) === taskId);
    if (!task) return;

    // Don't update if dropped in the same column
    if (task.status === newStatus) return;

    // Update task status
    await dispatch(updateMyTaskStatus({ taskId, status: newStatus }));
    dispatch(getMyTasks({}));
  };

  if (isTasksLoading && (!tasks || tasks.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("admin.myTasks.title")}</h1>
        <p className="text-muted-foreground">{t("admin.myTasks.subtitle")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("admin.myTasks.dragHint") ||
            "Drag tasks between columns to update status"}
        </p>
      </div>

      {/* Kanban Board with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
              locale={locale}
              t={t}
              formatDate={formatDate}
              isOverdue={isOverdue}
              getPriorityColor={getPriorityColor}
              getColumnTitle={getColumnTitle}
              isRtl={isRtl}
              activeTaskId={activeTask ? activeTask._id || activeTask.id : null}
            />
          ))}
        </div>

        {/* Drag Overlay for better visual feedback */}
        <DragOverlay>
          {activeTask && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-primary rotate-3 scale-105">
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <h4 className="font-medium text-sm line-clamp-2">
                  {locale === "ar"
                    ? activeTask.title?.ar || activeTask.title?.en
                    : activeTask.title?.en || activeTask.title?.ar}
                </h4>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
