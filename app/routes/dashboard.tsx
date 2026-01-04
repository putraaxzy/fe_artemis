import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { taskService, type Task } from "../services";
import { useAuth } from "../hooks";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { Header, Alert, Button } from "../components";
import {
  MdTask,
  MdLink,
  MdFilePresent,
  MdEdit,
  MdDelete,
  MdWarning,
  MdCheckCircle,
  MdSchedule,
  MdKeyboardArrowRight,
  MdLocalFireDepartment,
  MdWbSunny,
  MdNightsStay,
  MdArchive,
  MdVisibility,
  MdVisibilityOff,
  MdInfo,
  MdPeople,
  MdTrendingUp,
  MdCelebration,
  MdAutoAwesome,
  MdFileDownload,
} from "react-icons/md";

export function meta() {
  return [
    { title: "Dashboard - Tugas" },
    { name: "description", content: "Your task dashboard" },
  ];
}

// Utility functions
function getTimeGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: "Selamat Pagi", icon: <MdWbSunny className="w-5 h-5 text-amber-500" /> };
  } else if (hour >= 12 && hour < 17) {
    return { text: "Selamat Siang", icon: <MdWbSunny className="w-5 h-5 text-orange-500" /> };
  } else if (hour >= 17 && hour < 21) {
    return { text: "Selamat Sore", icon: <MdNightsStay className="w-5 h-5 text-purple-500" /> };
  } else {
    return { text: "Selamat Malam", icon: <MdNightsStay className="w-5 h-5 text-indigo-500" /> };
  }
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysSince(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRelativeDate(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)} hari lalu`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  if (days <= 7) return `${days} hari lagi`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// Progress Ring Component
function ProgressRing({ 
  progress, 
  size = 48, 
  strokeWidth = 4,
  label 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-zinc-900 transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-zinc-900">{label || `${Math.round(progress)}%`}</span>
      </div>
    </div>
  );
}

// Urgency Badge
function UrgencyBadge({ deadline, status }: { deadline?: string; status?: string }) {
  if (status === "selesai") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-xs font-medium">
        <MdCheckCircle className="w-3 h-3" /> Selesai
      </span>
    );
  }

  if (!deadline) return null;

  const days = getDaysUntil(deadline);
  
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium animate-pulse">
        <MdWarning className="w-3 h-3" /> Terlambat
      </span>
    );
  }
  
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium">
        <MdLocalFireDepartment className="w-3 h-3" /> Hari ini
      </span>
    );
  }
  
  if (days <= 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
        <MdSchedule className="w-3 h-3" /> {days} hari lagi
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-xs font-medium">
      <MdSchedule className="w-3 h-3" /> {formatRelativeDate(deadline)}
    </span>
  );
}

// Task Card - Compact & Clean
function TaskCard({ 
  task, 
  isGuru, 
  onClick, 
  onEdit, 
  onDelete,
  onExport,
  isArchived = false
}: { 
  task: Task; 
  isGuru: boolean; 
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  isArchived?: boolean;
}) {
  const progress = isGuru && task.total_siswa 
    ? Math.round(((task.selesai || 0) / task.total_siswa) * 100)
    : 0;

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] ${
        isArchived 
          ? "border-zinc-100 opacity-60 hover:opacity-100" 
          : "border-zinc-200 hover:border-zinc-400"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Progress Ring for Guru */}
        {isGuru && task.total_siswa ? (
          <div className="flex-shrink-0">
            <ProgressRing progress={progress} size={44} strokeWidth={3} />
          </div>
        ) : (
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            task.status === "selesai" ? "bg-zinc-100" :
            task.status === "dikirim" ? "bg-blue-50" :
            task.status === "ditolak" ? "bg-red-50" :
            "bg-amber-50"
          }`}>
            {task.tipe_pengumpulan === "link" ? (
              <MdLink className={`w-5 h-5 ${
                task.status === "selesai" ? "text-zinc-500" :
                task.status === "dikirim" ? "text-blue-600" :
                task.status === "ditolak" ? "text-red-600" :
                "text-amber-600"
              }`} />
            ) : task.tipe_pengumpulan === "pemberitahuan" ? (
              <MdInfo className={`w-5 h-5 ${
                task.status === "selesai" ? "text-zinc-500" : "text-zinc-600"
              }`} />
            ) : (
              <MdFilePresent className={`w-5 h-5 ${
                task.status === "selesai" ? "text-zinc-500" :
                task.status === "dikirim" ? "text-blue-600" :
                task.status === "ditolak" ? "text-red-600" :
                "text-amber-600"
              }`} />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-zinc-900 text-sm line-clamp-1 group-hover:text-zinc-700">
              {task.judul}
            </h3>
            <UrgencyBadge deadline={task.tanggal_deadline} status={task.status} />
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-500">
            {isGuru ? (
              <>
                <span className="flex items-center gap-1">
                  <MdPeople className="w-3.5 h-3.5" />
                  {task.total_siswa || 0} siswa
                </span>
                <span>•</span>
                <span>{task.selesai || 0} selesai</span>
                {(task.dikirim || 0) > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">{task.dikirim} menunggu</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span>{typeof task.guru === 'object' ? task.guru?.name : task.guru}</span>
                <span>•</span>
                <span className="capitalize">
                  {task.tipe_pengumpulan === "pemberitahuan" ? "Info" :
                   task.tipe_pengumpulan === "link" ? "Online" : "Langsung"}
                </span>
              </>
            )}
          </div>
        </div>

        <MdKeyboardArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-500 flex-shrink-0 transition-colors" />
      </div>

      {/* Guru Actions - Show on hover */}
      {isGuru && (onEdit || onDelete || onExport) && (
        <div className="absolute right-2 top-2 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-sm border border-zinc-200 p-0.5">
          {onExport && (
            <button
              onClick={(e) => { e.stopPropagation(); onExport(); }}
              className="p-1.5 hover:bg-emerald-50 rounded-md transition-colors"
              title="Export Excel"
            >
              <MdFileDownload className="w-4 h-4 text-emerald-600" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <MdEdit className="w-4 h-4 text-zinc-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
            >
              <MdDelete className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Task Section
function TaskSection({ 
  title, 
  icon, 
  tasks, 
  isGuru, 
  onTaskClick,
  onEdit,
  onDelete,
  onExport,
  collapsible = false,
  defaultCollapsed = false,
  emptyMessage,
  isArchived = false
}: { 
  title: string;
  icon?: React.ReactNode;
  tasks: Task[];
  isGuru: boolean;
  onTaskClick: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onExport?: (id: number) => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  emptyMessage?: string;
  isArchived?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0 && !emptyMessage) return null;

  return (
    <div className="space-y-3">
      <button 
        onClick={() => collapsible && setCollapsed(!collapsed)}
        className={`flex items-center gap-2 w-full text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
      >
        {icon}
        <h2 className="text-sm font-bold text-zinc-800">{title}</h2>
        <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
        {collapsible && (
          <MdKeyboardArrowRight className={`w-4 h-4 text-zinc-400 ml-auto transition-transform ${collapsed ? "" : "rotate-90"}`} />
        )}
      </button>

      {!collapsed && (
        tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskCard 
                key={task.id}
                task={task}
                isGuru={isGuru}
                onClick={() => onTaskClick(task.id)}
                onEdit={onEdit ? () => onEdit(task.id) : undefined}
                onDelete={onDelete ? () => onDelete(task.id) : undefined}
                onExport={onExport ? () => onExport(task.id) : undefined}
                isArchived={isArchived}
              />
            ))}
          </div>
        ) : emptyMessage ? (
          <p className="text-sm text-zinc-400 py-4 text-center">{emptyMessage}</p>
        ) : null
      )}
    </div>
  );
}

// Stats Card for Guru
function GuruStatsCard({ tasks }: { tasks: Task[] }) {
  const totalStudents = tasks.reduce((sum, t) => sum + (t.total_siswa || 0), 0);
  const totalCompleted = tasks.reduce((sum, t) => sum + (t.selesai || 0), 0);
  const totalPending = tasks.reduce((sum, t) => sum + (t.dikirim || 0), 0);
  const completionRate = totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0;

  return (
    <div className="bg-zinc-900 text-white rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Tingkat Penyelesaian</p>
          <p className="text-3xl font-black mt-1">{completionRate}%</p>
        </div>
        <ProgressRing 
          progress={completionRate} 
          size={56} 
          strokeWidth={4}
          label=""
        />
      </div>
      
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800">
        <div>
          <p className="text-2xl font-bold">{tasks.length}</p>
          <p className="text-xs text-zinc-400">Tugas</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{totalPending}</p>
          <p className="text-xs text-zinc-400">Menunggu</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{totalCompleted}</p>
          <p className="text-xs text-zinc-400">Selesai</p>
        </div>
      </div>
    </div>
  );
}

// Quick Action Button
function QuickAction({ 
  icon, 
  label, 
  onClick,
  highlight = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
        highlight 
          ? "bg-zinc-900 text-white hover:bg-zinc-800" 
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// Main Dashboard
export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isGuru, isSiswa, user, isLoading: authLoading } = useAuth();
  const { lastNotification } = useRealtimeNotifications();
  const greeting = getTimeGreeting();

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await taskService.getTasks();
      if (response.berhasil) {
        setTasks(response.data);
      } else {
        setError(response.pesan || "Failed to fetch tasks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (lastNotification && (lastNotification.type === 'task_created' || lastNotification.type === 'task_submitted')) {
      fetchTasks();
    }
  }, [lastNotification, fetchTasks]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, [isAuthenticated, authLoading, navigate, fetchTasks]);

  const handleDelete = async (taskId: number) => {
    setIsDeleting(true);
    try {
      const response = await taskService.deleteTask(taskId);
      if (response.berhasil) {
        await fetchTasks();
        setDeleteId(null);
      } else {
        setError(response.pesan || "Gagal menghapus tugas");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus tugas");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async (taskId: number) => {
    try {
      const blob = await taskService.exportTask(taskId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tugas-${taskId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal export tugas");
    }
  };

  // Smart task grouping
  const groupedTasks = useMemo(() => {
    const now = new Date();
    
    // For Siswa: Group by urgency and status
    if (isSiswa) {
      const overdue: Task[] = [];
      const urgent: Task[] = []; // Due today or tomorrow
      const thisWeek: Task[] = [];
      const upcoming: Task[] = [];
      const completed: Task[] = [];
      const recentlyCompleted: Task[] = []; // Completed in last 3 days

      tasks.forEach(task => {
        if (task.status === "selesai") {
          const daysSince = task.diperbarui_pada ? getDaysSince(task.diperbarui_pada) : 999;
          if (daysSince <= 3) {
            recentlyCompleted.push(task);
          } else {
            completed.push(task);
          }
          return;
        }

        if (!task.tanggal_deadline) {
          upcoming.push(task);
          return;
        }

        const days = getDaysUntil(task.tanggal_deadline);
        if (days < 0) {
          overdue.push(task);
        } else if (days <= 1) {
          urgent.push(task);
        } else if (days <= 7) {
          thisWeek.push(task);
        } else {
          upcoming.push(task);
        }
      });

      // Sort by deadline
      const sortByDeadline = (a: Task, b: Task) => {
        if (!a.tanggal_deadline) return 1;
        if (!b.tanggal_deadline) return -1;
        return new Date(a.tanggal_deadline).getTime() - new Date(b.tanggal_deadline).getTime();
      };

      return {
        overdue: overdue.sort(sortByDeadline),
        urgent: urgent.sort(sortByDeadline),
        thisWeek: thisWeek.sort(sortByDeadline),
        upcoming: upcoming.sort(sortByDeadline),
        recentlyCompleted,
        completed
      };
    }

    // For Guru: Group by activity
    const needsReview: Task[] = []; // Has submissions to review
    const active: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach(task => {
      if ((task.dikirim || 0) > 0) {
        needsReview.push(task);
      } else if ((task.selesai || 0) === (task.total_siswa || 0) && (task.total_siswa || 0) > 0) {
        completed.push(task);
      } else {
        active.push(task);
      }
    });

    return { needsReview, active, completed };
  }, [tasks, isSiswa]);

  // Context-aware messages
  const getContextMessage = () => {
    if (isSiswa) {
      const { overdue, urgent, thisWeek, upcoming, recentlyCompleted } = groupedTasks as any;
      const activeTasks = (overdue?.length || 0) + (urgent?.length || 0) + (thisWeek?.length || 0) + (upcoming?.length || 0);
      
      if (activeTasks === 0 && recentlyCompleted?.length > 0) {
        return "Semua tugas selesai! Istirahat yang cukup ya";
      }
      if (overdue?.length > 0) {
        return `Ada ${overdue.length} tugas yang sudah lewat deadline`;
      }
      if (urgent?.length > 0) {
        return `${urgent.length} tugas perlu diselesaikan segera`;
      }
      if (activeTasks === 0) {
        return "Belum ada tugas. Enjoy your free time!";
      }
      return `${activeTasks} tugas aktif`;
    }

    const { needsReview, active } = groupedTasks as any;
    if (needsReview?.length > 0) {
      return `${needsReview.length} tugas menunggu review`;
    }
    if (active?.length === 0) {
      return "Buat tugas baru untuk memulai";
    }
    return `${active?.length || 0} tugas aktif`;
  };

  if (authLoading) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-50 pt-14">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {greeting.icon}
              <span className="text-sm text-zinc-500">{greeting.text}</span>
            </div>
            <h1 className="text-2xl font-black text-zinc-900">
              @{user?.username || 'Dashboard'}
            </h1>
            <p className="text-sm text-zinc-500">{getContextMessage()}</p>
          </div>

          {/* Error */}
          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {isGuru && (
              <QuickAction 
                icon={<MdTask className="w-4 h-4" />}
                label="Buat Tugas"
                onClick={() => navigate("/create-task")}
                highlight
              />
            )}
            <QuickAction 
              icon={<MdTrendingUp className="w-4 h-4" />}
              label="Explore"
              onClick={() => navigate("/explore")}
            />
            {tasks.some(t => t.status === "selesai") && (
              <QuickAction 
                icon={showArchived ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                label={showArchived ? "Sembunyikan Arsip" : "Lihat Arsip"}
                onClick={() => setShowArchived(!showArchived)}
              />
            )}
          </div>

          {/* Guru Stats */}
          {isGuru && tasks.length > 0 && (
            <GuruStatsCard tasks={tasks} />
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && tasks.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MdTask className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-1">Belum ada tugas</h3>
              <p className="text-sm text-zinc-500">
                {isGuru ? "Buat tugas pertama Anda" : "Tidak ada tugas yang ditugaskan"}
              </p>
            </div>
          )}

          {/* Task Lists - Siswa */}
          {!isLoading && isSiswa && (
            <div className="space-y-6">
              {(groupedTasks as any).overdue?.length > 0 && (
                <TaskSection
                  title="Terlambat"
                  icon={<MdWarning className="w-4 h-4 text-red-500" />}
                  tasks={(groupedTasks as any).overdue}
                  isGuru={false}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                />
              )}

              {(groupedTasks as any).urgent?.length > 0 && (
                <TaskSection
                  title="Segera"
                  icon={<MdLocalFireDepartment className="w-4 h-4 text-amber-500" />}
                  tasks={(groupedTasks as any).urgent}
                  isGuru={false}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                />
              )}

              {(groupedTasks as any).thisWeek?.length > 0 && (
                <TaskSection
                  title="Minggu Ini"
                  icon={<MdSchedule className="w-4 h-4 text-zinc-500" />}
                  tasks={(groupedTasks as any).thisWeek}
                  isGuru={false}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                />
              )}

              {(groupedTasks as any).upcoming?.length > 0 && (
                <TaskSection
                  title="Akan Datang"
                  icon={<MdSchedule className="w-4 h-4 text-zinc-400" />}
                  tasks={(groupedTasks as any).upcoming}
                  isGuru={false}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                  collapsible
                  defaultCollapsed={(groupedTasks as any).upcoming.length > 5}
                />
              )}

              {(groupedTasks as any).recentlyCompleted?.length > 0 && (
                <TaskSection
                  title="Baru Selesai"
                  icon={<MdCheckCircle className="w-4 h-4 text-zinc-400" />}
                  tasks={(groupedTasks as any).recentlyCompleted}
                  isGuru={false}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                  collapsible
                  defaultCollapsed
                  isArchived
                />
              )}

              {showArchived && (groupedTasks as any).completed?.length > 0 && (
                <TaskSection
                  title="Arsip Selesai"
                  icon={<MdArchive className="w-4 h-4 text-zinc-400" />}
                  tasks={(groupedTasks as any).completed}
                  isGuru={false}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                  collapsible
                  defaultCollapsed
                  isArchived
                />
              )}

              {/* All done message */}
              {(groupedTasks as any).overdue?.length === 0 &&
               (groupedTasks as any).urgent?.length === 0 &&
               (groupedTasks as any).thisWeek?.length === 0 &&
               (groupedTasks as any).upcoming?.length === 0 &&
               tasks.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MdCelebration className="w-6 h-6 text-zinc-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900 mb-1">Semua tugas selesai!</h3>
                  <p className="text-sm text-zinc-500">Kerja bagus! Istirahat yang cukup.</p>
                </div>
              )}
            </div>
          )}

          {/* Task Lists - Guru */}
          {!isLoading && isGuru && (
            <div className="space-y-6">
              {(groupedTasks as any).needsReview?.length > 0 && (
                <TaskSection
                  title="Perlu Review"
                  icon={<MdWarning className="w-4 h-4 text-amber-500" />}
                  tasks={(groupedTasks as any).needsReview}
                  isGuru={true}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                  onEdit={(id) => navigate(`/edit-task/${id}`)}
                  onDelete={(id) => setDeleteId(id)}
                  onExport={handleExport}
                />
              )}

              {(groupedTasks as any).active?.length > 0 && (
                <TaskSection
                  title="Tugas Aktif"
                  icon={<MdTask className="w-4 h-4 text-zinc-500" />}
                  tasks={(groupedTasks as any).active}
                  isGuru={true}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                  onEdit={(id) => navigate(`/edit-task/${id}`)}
                  onDelete={(id) => setDeleteId(id)}
                  onExport={handleExport}
                />
              )}

              {showArchived && (groupedTasks as any).completed?.length > 0 && (
                <TaskSection
                  title="Selesai"
                  icon={<MdCheckCircle className="w-4 h-4 text-zinc-400" />}
                  tasks={(groupedTasks as any).completed}
                  isGuru={true}
                  onTaskClick={(id) => navigate(`/dashboard/${id}`)}
                  onEdit={(id) => navigate(`/edit-task/${id}`)}
                  onDelete={(id) => setDeleteId(id)}
                  onExport={handleExport}
                  collapsible
                  defaultCollapsed
                  isArchived
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MdDelete className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">Hapus Tugas?</h3>
              <p className="text-sm text-zinc-500">Tindakan ini tidak dapat dibatalkan.</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1"
              >
                Batal
              </Button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? "..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
