import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { taskService, type TaskDetail, type Penugasan } from "../services/api";
import { STORAGE_URL } from "../config/api";
import { useAuth } from "../hooks/useAuth";
import { Header } from "../components/Header";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import {
  MdLink,
  MdFilePresent,
  MdPeople,
  MdCheck,
  MdCheckCircle,
  MdCalendarToday,
  MdSchedule,
  MdDescription,
  MdTimer,
  MdAttachFile,
  MdAudiotrack,
  MdAssignment,
  MdCancel,
  MdComment,
  MdDownload,
  MdWarning,
  MdSend,
  MdInfo,
  MdArrowBack,
  MdLocalFireDepartment,
  MdEdit,
  MdVisibility,
  MdVisibilityOff,
  MdOpenInNew,
  MdGrade,
  MdTrendingUp,
  MdAccessTime,
  MdFileDownload,
} from "react-icons/md";
import { FaUserGraduate } from "react-icons/fa";
import { ConfirmModal } from "../components/Modal";

export function meta() {
  return [
    { title: "Task Detail - Tugas" },
    { name: "description", content: "View task details" },
  ];
}

// Utility functions
function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRelativeDeadline(dateStr: string): { text: string; urgent: boolean; late: boolean } {
  const days = getDaysUntil(dateStr);
  if (days < 0) return { text: `Terlambat ${Math.abs(days)} hari`, urgent: false, late: true };
  if (days === 0) return { text: "Hari ini", urgent: true, late: false };
  if (days === 1) return { text: "Besok", urgent: true, late: false };
  if (days <= 3) return { text: `${days} hari lagi`, urgent: true, late: false };
  if (days <= 7) return { text: `${days} hari lagi`, urgent: false, late: false };
  return { text: new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" }), urgent: false, late: false };
}

// Progress Ring Component
function ProgressRing({ progress, size = 48, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-zinc-200" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-zinc-900 transition-all duration-500" />
      </svg>
      <span className="absolute text-xs font-bold text-zinc-900">{Math.round(progress)}%</span>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, isPemberitahuan }: { status: string; isPemberitahuan?: boolean }) {
  if (isPemberitahuan) {
    return status === "selesai" ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 text-white text-xs font-medium">
        <MdCheck className="w-3 h-3" /> Sudah Dibaca
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-medium">
        <MdSchedule className="w-3 h-3" /> Belum Dibaca
      </span>
    );
  }

  const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    pending: { bg: "bg-zinc-100", text: "text-zinc-700", icon: <MdSchedule className="w-3 h-3" />, label: "Belum Dikumpulkan" },
    dikirim: { bg: "bg-amber-50", text: "text-amber-700", icon: <MdAccessTime className="w-3 h-3" />, label: "Menunggu Penilaian" },
    selesai: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <MdCheckCircle className="w-3 h-3" />, label: "Diterima" },
    ditolak: { bg: "bg-red-50", text: "text-red-700", icon: <MdCancel className="w-3 h-3" />, label: "Ditolak" },
  };

  const config = configs[status] || configs.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${config.bg} ${config.text} text-xs font-medium`}>
      {config.icon} {config.label}
    </span>
  );
}

// Stat Card Component
function StatCard({ label, value, color = "zinc" }: { label: string; value: number; color?: "zinc" | "amber" | "emerald" | "red" }) {
  const colors = {
    zinc: "bg-zinc-50 border-zinc-200 text-zinc-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    red: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div className={`p-3 sm:p-4 rounded-xl border ${colors[color]}`}>
      <p className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isGuru, isSiswa, isLoading: authLoading } = useAuth();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkDrive, setLinkDrive] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Guru grading state
  const [gradingPenugasanId, setGradingPenugasanId] = useState<number | null>(null);
  const [gradeNilai, setGradeNilai] = useState("");
  const [gradeCatatan, setGradeCatatan] = useState("");
  const [gradeStatus, setGradeStatus] = useState<"selesai" | "ditolak">("selesai");
  const [isGrading, setIsGrading] = useState(false);

  const fetchTaskDetail = async () => {
    if (!id) {
      setError("Task ID tidak ditemukan");
      return;
    }

    try {
      setIsLoading(true);
      const response = await taskService.getTaskDetail(parseInt(id));
      if (response.berhasil) {
        setTask(response.data);
      } else {
        setError(response.pesan || "Gagal memuat detail tugas");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat detail tugas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchTaskDetail();
  }, [isAuthenticated, authLoading, navigate, id]);

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!id) return;

    if (task?.tipe_pengumpulan === "link" && !linkDrive.trim()) {
      setSubmitError("Harap masukkan link Google Drive");
      return;
    }

    setShowConfirmModal(true);
  };

  const processTaskSubmission = async () => {
    if (!id) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const response = await taskService.submitTask(parseInt(id), {
        link_drive: linkDrive || undefined,
      });

      if (response.berhasil) {
        setSubmitSuccess(true);
        setLinkDrive("");
        await fetchTaskDetail();
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setSubmitError(response.pesan || "Gagal mengumpulkan tugas");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengumpulkan tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmit = async (penugasanId: number) => {
    if (!id) return;

    if (task?.tampilkan_nilai && gradeStatus === "selesai") {
      const nilaiNum = parseInt(gradeNilai);
      if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        alert("Nilai harus antara 0-100");
        return;
      }
    }

    setIsGrading(true);
    try {
      const response = await taskService.updateAssignmentStatus(penugasanId, {
        status: gradeStatus,
        nilai: task?.tampilkan_nilai && gradeStatus === "selesai" ? parseInt(gradeNilai) : undefined,
        catatan_guru: gradeCatatan || undefined,
      });

      if (response.berhasil) {
        setGradingPenugasanId(null);
        setGradeNilai("");
        setGradeCatatan("");
        setGradeStatus("selesai");
        await fetchTaskDetail();
      } else {
        alert(response.pesan || "Gagal memberikan nilai");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsGrading(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const blob = await taskService.exportTask(parseInt(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tugas-${task?.judul || id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal export tugas");
    }
  };

  // Loading State
  if (isLoading || authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-zinc-50 pt-14">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-32 bg-zinc-200 rounded-lg" />
              <div className="h-32 bg-zinc-200 rounded-2xl" />
              <div className="h-48 bg-zinc-200 rounded-2xl" />
            </div>
          </div>
        </main>
      </>
    );
  }

  // Error State
  if (error || !task) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-zinc-50 pt-14">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
                <MdWarning className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Terjadi Kesalahan</h2>
              <p className="text-sm text-zinc-600 mb-4">{error || "Tugas tidak ditemukan"}</p>
              <Button onClick={() => navigate("/dashboard")} size="sm">Kembali ke Dashboard</Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const deadlineInfo = task.tanggal_deadline ? formatRelativeDeadline(task.tanggal_deadline) : null;
  const isPemberitahuan = task.tipe_pengumpulan === "pemberitahuan";
  const completionRate = task.statistik?.total_siswa ? Math.round((task.statistik.selesai / task.statistik.total_siswa) * 100) : 0;

  return (
    <>
      <Header />
      
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={processTaskSubmission}
        onCancel={() => setShowConfirmModal(false)}
        title={isPemberitahuan ? "Konfirmasi Sudah Dibaca" : "Konfirmasi Pengumpulan"}
        message={isPemberitahuan ? "Anda yakin sudah membaca pemberitahuan ini?" : "Pastikan link yang Anda masukkan sudah benar."}
        confirmText={isPemberitahuan ? "Ya, Sudah Dibaca" : "Ya, Kumpulkan"}
        cancelText="Batal"
      />

      <main className="min-h-screen bg-zinc-50 pt-14 pb-6">
        <div className="max-w-4xl mx-auto px-4 py-4">
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 mb-3 transition-colors"
          >
            <MdArrowBack className="w-4 h-4" />
            Kembali
          </button>

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 mb-3">
            <div className="flex flex-col gap-4">
              {/* Top Row: Type Badge + Edit Button */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  isPemberitahuan ? "bg-blue-50 text-blue-700" : task.tipe_pengumpulan === "link" ? "bg-purple-50 text-purple-700" : "bg-zinc-100 text-zinc-700"
                }`}>
                  {isPemberitahuan ? <><MdInfo className="w-3.5 h-3.5" /> Pemberitahuan</> : task.tipe_pengumpulan === "link" ? <><MdLink className="w-3.5 h-3.5" /> Link</> : <><MdFilePresent className="w-3.5 h-3.5" /> Langsung</>}
                </span>
                {isGuru && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExport}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <MdFileDownload className="w-3.5 h-3.5" /> Export
                    </button>
                    <button
                      onClick={() => navigate(`/edit-task/${id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                    >
                      <MdEdit className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-xl font-bold text-zinc-900 leading-tight break-words">
                {task.judul}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <MdCalendarToday className="w-3.5 h-3.5" />
                  {new Date(task.dibuat_pada).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <MdPeople className="w-3.5 h-3.5" />
                  {task.target === "siswa" ? "Siswa Tertentu" : "Kelas"}
                </span>
                {task.tampilkan_nilai ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <MdVisibility className="w-3.5 h-3.5" /> Nilai Ditampilkan
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <MdVisibilityOff className="w-3.5 h-3.5" /> Nilai Disembunyikan
                  </span>
                )}
              </div>

              {/* Deadline Badge */}
              {deadlineInfo && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl w-fit ${
                  deadlineInfo.late ? "bg-red-50 text-red-700" : deadlineInfo.urgent ? "bg-amber-50 text-amber-700" : "bg-zinc-50 text-zinc-700"
                }`}>
                  {(deadlineInfo.late || deadlineInfo.urgent) && <MdLocalFireDepartment className="w-4 h-4" />}
                  <MdTimer className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {deadlineInfo.late ? "Terlambat" : "Deadline"}: {deadlineInfo.text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description & Dates */}
          {(task.deskripsi || task.tanggal_mulai || task.tanggal_deadline || task.file_detail) && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 mb-3">
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <MdDescription className="w-4 h-4" /> Detail
              </h2>

              {task.deskripsi && (
                <div className="bg-zinc-50 rounded-xl p-3 sm:p-4 border border-zinc-100 mb-4">
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap break-words leading-relaxed">{task.deskripsi}</p>
                </div>
              )}

              {/* Dates */}
              {(task.tanggal_mulai || task.tanggal_deadline) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {task.tanggal_mulai && (
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                        <MdSchedule className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Mulai</p>
                        <p className="text-xs font-medium text-zinc-900 truncate">
                          {new Date(task.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )}
                  {task.tanggal_deadline && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                      deadlineInfo?.late ? "bg-red-50 border-red-200" : deadlineInfo?.urgent ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-100"
                    }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        deadlineInfo?.late ? "bg-red-100 text-red-600" : deadlineInfo?.urgent ? "bg-amber-100 text-amber-600" : "bg-white border border-zinc-200 text-zinc-600"
                      }`}>
                        <MdTimer className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[10px] uppercase tracking-wide ${deadlineInfo?.late ? "text-red-600" : deadlineInfo?.urgent ? "text-amber-600" : "text-zinc-500"}`}>Deadline</p>
                        <p className={`text-xs font-medium truncate ${deadlineInfo?.late ? "text-red-700" : deadlineInfo?.urgent ? "text-amber-700" : "text-zinc-900"}`}>
                          {new Date(task.tanggal_deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Attachment */}
              {task.file_detail && (() => {
                const fileUrl = `${STORAGE_URL}/${task.file_detail}`;
                const fileName = task.file_detail.split("/").pop() || "file";
                const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
                const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
                const videoFormats = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
                const audioFormats = ["mp3", "wav", "ogg", "aac", "m4a"];

                return (
                  <div>
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <MdAttachFile className="w-3.5 h-3.5" /> Lampiran
                    </p>
                    {imageFormats.includes(fileExt) && (
                      <div className="rounded-xl overflow-hidden border border-zinc-200">
                        <img src={fileUrl} alt="Lampiran" className="w-full h-auto" />
                      </div>
                    )}
                    {videoFormats.includes(fileExt) && (
                      <div className="rounded-xl overflow-hidden bg-zinc-900">
                        <video controls className="w-full h-auto" preload="metadata">
                          <source src={fileUrl} type={`video/${fileExt}`} />
                        </video>
                      </div>
                    )}
                    {audioFormats.includes(fileExt) && (
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <audio controls className="w-full" preload="metadata">
                          <source src={fileUrl} type={`audio/${fileExt}`} />
                        </audio>
                        <p className="text-xs text-zinc-500 mt-2 text-center flex items-center justify-center gap-1">
                          <MdAudiotrack className="w-3.5 h-3.5" /> {fileName}
                        </p>
                      </div>
                    )}
                    {!imageFormats.includes(fileExt) && !videoFormats.includes(fileExt) && !audioFormats.includes(fileExt) && (
                      <a href={fileUrl} download className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors text-sm font-medium">
                        <MdDownload className="w-4 h-4" /> Download {fileName}
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Guru: Statistics */}
          {isGuru && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 mb-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide flex items-center gap-1.5">
                  <MdTrendingUp className="w-4 h-4" /> Statistik
                </h2>
                <ProgressRing progress={completionRate} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {isPemberitahuan ? (
                  <>
                    <StatCard label="Belum Membaca" value={task.statistik.pending} />
                    <StatCard label="Sudah Membaca" value={task.statistik.selesai} color="emerald" />
                  </>
                ) : (
                  <>
                    <StatCard label="Menunggu" value={task.statistik.pending} />
                    <StatCard label="Dikirim" value={task.statistik.dikirim} color="amber" />
                    <StatCard label="Selesai" value={task.statistik.selesai} color="emerald" />
                    <StatCard label="Ditolak" value={task.statistik.ditolak} color="red" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Siswa: Submission Status */}
          {isSiswa && task.penugasan && task.penugasan[0] && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 mb-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide flex items-center gap-1.5">
                  <MdAssignment className="w-4 h-4" /> {isPemberitahuan ? "Status" : "Pengumpulan"}
                </h2>
                <StatusBadge status={task.penugasan[0].status} isPemberitahuan={isPemberitahuan} />
              </div>

              {/* Rejection Alert */}
              {task.penugasan[0].status === "ditolak" && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <MdCancel className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-red-800 mb-0.5">Perlu Revisi</h3>
                      <p className="text-xs text-red-700">Silakan periksa catatan guru dan kumpulkan ulang.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Info */}
              <div className="bg-zinc-50 rounded-xl border border-zinc-100 divide-y divide-zinc-100">
                {task.penugasan[0].link_drive && (
                  <div className="flex items-center justify-between p-3">
                    <span className="text-xs text-zinc-600">Link</span>
                    <a href={task.penugasan[0].link_drive} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 hover:underline">
                      <MdOpenInNew className="w-3.5 h-3.5" /> Lihat
                    </a>
                  </div>
                )}
                {task.penugasan[0].tanggal_pengumpulan && (
                  <div className="flex items-center justify-between p-3">
                    <span className="text-xs text-zinc-600">{isPemberitahuan ? "Dibaca" : "Dikumpulkan"}</span>
                    <span className="text-xs font-medium text-zinc-900">
                      {new Date(task.penugasan[0].tanggal_pengumpulan).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                {task.tampilkan_nilai && task.penugasan[0].nilai !== null && task.penugasan[0].nilai !== undefined && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-600">Nilai</span>
                      <span className="text-lg font-bold text-zinc-900">{task.penugasan[0].nilai}<span className="text-xs text-zinc-500">/100</span></span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full transition-all ${task.penugasan[0].nilai >= 75 ? "bg-emerald-500" : task.penugasan[0].nilai >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${task.penugasan[0].nilai}%` }} />
                    </div>
                  </div>
                )}
                {task.penugasan[0].catatan_guru && (
                  <div className="p-3">
                    <p className="text-xs text-zinc-600 mb-1.5 flex items-center gap-1"><MdComment className="w-3.5 h-3.5" /> Catatan Guru</p>
                    <div className="bg-white rounded-lg p-2 border border-zinc-200">
                      <p className="text-xs text-zinc-800 whitespace-pre-wrap">{task.penugasan[0].catatan_guru}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Form */}
              {(task.penugasan[0].status === "pending" || task.penugasan[0].status === "ditolak") && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  {submitSuccess && <Alert type="success" message="Berhasil! Mengalihkan..." className="mb-3" />}
                  {submitError && <Alert type="error" message={submitError} onClose={() => setSubmitError("")} className="mb-3" />}

                  <form onSubmit={handleSubmitTask} className="space-y-3">
                    {task.tipe_pengumpulan === "link" && (
                      <Input
                        label="Link Google Drive"
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={linkDrive}
                        onChange={(e) => setLinkDrive(e.target.value)}
                        required
                        disabled={isSubmitting}
                        helperText="Pastikan link dapat diakses"
                      />
                    )}
                    {isPemberitahuan && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-xs text-blue-800 flex items-center gap-1.5">
                          <MdInfo className="w-4 h-4 flex-shrink-0" />
                          Klik tombol di bawah untuk konfirmasi sudah membaca.
                        </p>
                      </div>
                    )}
                    <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
                      {isPemberitahuan ? <><MdCheck className="w-4 h-4" /> Tandai Sudah Dibaca</> : <><MdSend className="w-4 h-4" /> Kumpulkan Tugas</>}
                    </Button>
                  </form>
                </div>
              )}

              {/* Waiting Message */}
              {task.penugasan[0].status === "dikirim" && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex gap-2">
                    <MdSchedule className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800">Menunggu Penilaian</p>
                      <p className="text-[10px] text-amber-700">Tugas sedang direview guru.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guru: Submissions List */}
          {isGuru && task.penugasan && task.penugasan.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide flex items-center gap-1.5">
                  <MdPeople className="w-4 h-4" /> {isPemberitahuan ? "Daftar Pembaca" : "Pengumpulan Siswa"}
                </h2>
                <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                  {task.penugasan.filter(p => p.siswa.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.siswa.kelas?.toLowerCase().includes(searchQuery.toLowerCase())).length} siswa
                </span>
              </div>

              {/* Search */}
              <div className="mb-4">
                <Input type="text" placeholder="Cari nama atau kelas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              {/* List */}
              <div className="space-y-2">
                {task.penugasan
                  .filter(p => p.siswa.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.siswa.kelas?.toLowerCase().includes(searchQuery.toLowerCase()) || p.siswa.jurusan?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((penugasan) => (
                    <div key={penugasan.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-zinc-900 truncate">{penugasan.siswa.name}</h3>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <FaUserGraduate className="w-2.5 h-2.5" />
                            {penugasan.siswa.kelas} - {penugasan.siswa.jurusan}
                          </p>
                          {penugasan.tanggal_pengumpulan && (
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {new Date(penugasan.tanggal_pengumpulan).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={penugasan.status} isPemberitahuan={isPemberitahuan} />
                          {penugasan.link_drive && (
                            <a href={penugasan.link_drive} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-zinc-900 text-white text-[10px] font-medium rounded-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-1">
                              <MdOpenInNew className="w-3 h-3" /> Lihat
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Grading Form */}
                      {!isPemberitahuan && penugasan.status === "dikirim" && gradingPenugasanId === penugasan.id && (
                        <div className="mt-3 pt-3 border-t border-zinc-200 space-y-3">
                          <h4 className="text-xs font-medium text-zinc-900 flex items-center gap-1"><MdGrade className="w-3.5 h-3.5" /> Penilaian</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-medium text-zinc-600 mb-1">Status</label>
                              <select value={gradeStatus} onChange={(e) => setGradeStatus(e.target.value as "selesai" | "ditolak")} className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white text-xs">
                                <option value="selesai">Diterima</option>
                                <option value="ditolak">Ditolak</option>
                              </select>
                            </div>
                            {task.tampilkan_nilai && gradeStatus === "selesai" && (
                              <div>
                                <label className="block text-[10px] font-medium text-zinc-600 mb-1">Nilai (0-100)</label>
                                <input type="number" min="0" max="100" value={gradeNilai} onChange={(e) => setGradeNilai(e.target.value)} placeholder="0-100" className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-xs" />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-zinc-600 mb-1">Catatan</label>
                            <textarea value={gradeCatatan} onChange={(e) => setGradeCatatan(e.target.value)} placeholder="Opsional..." rows={2} className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-xs resize-none" />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleGradeSubmit(penugasan.id)} isLoading={isGrading} size="sm">
                              <MdCheck className="w-3.5 h-3.5" /> Simpan
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => { setGradingPenugasanId(null); setGradeNilai(""); setGradeCatatan(""); setGradeStatus("selesai"); }} disabled={isGrading}>
                              Batal
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Grade Button */}
                      {!isPemberitahuan && penugasan.status === "dikirim" && gradingPenugasanId !== penugasan.id && (
                        <div className="mt-2 pt-2 border-t border-zinc-200">
                          <button onClick={() => setGradingPenugasanId(penugasan.id)} className="text-[10px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors inline-flex items-center gap-1">
                            <MdGrade className="w-3.5 h-3.5" /> Beri Nilai
                          </button>
                        </div>
                      )}

                      {/* Display Grade Info */}
                      {(penugasan.nilai !== undefined || penugasan.catatan_guru) && (
                        <div className="mt-2 pt-2 border-t border-zinc-200">
                          {penugasan.nilai !== undefined && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-zinc-500">Nilai:</span>
                              <span className="text-xs font-bold text-zinc-900">{penugasan.nilai}/100</span>
                              <div className="flex-1 bg-zinc-200 rounded-full h-1 overflow-hidden">
                                <div className={`h-1 rounded-full ${penugasan.nilai >= 75 ? "bg-emerald-500" : penugasan.nilai >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${penugasan.nilai}%` }} />
                              </div>
                            </div>
                          )}
                          {penugasan.catatan_guru && (
                            <div>
                              <p className="text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1"><MdComment className="w-3 h-3" /> Catatan:</p>
                              <p className="text-[10px] text-zinc-700 bg-white rounded-lg p-1.5 border border-zinc-100">{penugasan.catatan_guru}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
