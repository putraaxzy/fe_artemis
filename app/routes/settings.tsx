import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks";
import { usePushNotification } from "~/hooks/usePushNotification";
import { Header, Alert, Button, Input } from "../components";
import { userService, type User } from "../services/api";
import {
  MdArrowBack,
  MdCheckCircle,
  MdEdit,
  MdSave,
  MdCameraAlt,
  MdClose,
  MdWarning,
  MdNotifications,
  MdNotificationsActive,
  MdInstallMobile,
  MdError,
} from "react-icons/md";
import { FaUser } from "react-icons/fa";

export function meta() {
  return [
    { title: "Settings - Tugas" },
    { name: "description", content: "Update your profile" },
  ];
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Push notification hook
  const {
    isSupported: notifSupported,
    permission: notifPermission,
    isSubscribed: notifSubscribed,
    isLoading: notifLoading,
    error: notifError,
    subscribe: notifSubscribe,
    unsubscribe: notifUnsubscribe,
  } = usePushNotification();

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    telepon: "",
    password: "",
    confirmPassword: "",
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  // PWA install prompt listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsPwaInstalled(true);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    // Isi form dengan data user
    setFormData((prev) => ({
      ...prev,
      username: user.username,
      name: user.name,
      telepon: user.telepon || "",
    }));

    // Cek jika first login
    if (user.is_first_login) {
      setShowFirstLoginModal(true);
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file maksimal 10MB");
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    if (formData.username && formData.username.length < 3) {
      setError("Username minimal 3 karakter");
      return false;
    }

    if (formData.username && formData.username.length > 30) {
      setError("Username maksimal 30 karakter");
      return false;
    }

    if (formData.username && !/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
      setError("Username hanya boleh huruf, angka, titik, dan underscore");
      return false;
    }

    if (formData.password && formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let response;

      if (avatarFile) {
        // Gunakan FormData jika ada avatar
        const fd = new FormData();
        fd.append("name", formData.name);
        fd.append("telepon", formData.telepon);
        if (formData.username !== user.username) {
          fd.append("username", formData.username);
        }
        if (formData.password) {
          fd.append("password", formData.password);
        }
        fd.append("avatar", avatarFile);
        fd.append("_method", "PUT"); // Laravel method spoofing

        response = await userService.updateProfileWithAvatar(fd);
      } else {
        // JSON biasa
        const updateData: any = {
          name: formData.name,
          telepon: formData.telepon,
        };

        if (formData.username !== user.username) {
          updateData.username = formData.username;
        }

        if (formData.password) {
          updateData.password = formData.password;
        }

        response = await userService.updateProfile(updateData);
      }

      if (response.berhasil) {
        setSuccess("Profil berhasil diperbarui!");
        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);

        // Update user di local storage
        if (response.data) {
          userService.setUser(response.data);
          refreshUser?.();
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.pesan || "Gagal memperbarui profil");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim()) {
      setError("Username harus diisi");
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
      setError("Username hanya boleh huruf, angka, titik, dan underscore");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("username", formData.username);
      fd.append("password", formData.password);
      if (formData.telepon) {
        fd.append("telepon", formData.telepon);
      }
      if (avatarFile) {
        fd.append("avatar", avatarFile);
      }

      const response = await userService.completeFirstLogin(fd);

      if (response.berhasil) {
        userService.setUser(response.data);
        refreshUser?.();
        setShowFirstLoginModal(false);
        setSuccess("Selamat datang! Profil berhasil diperbarui.");
        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setError(response.pesan || "Gagal menyimpan profil");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatar = avatarPreview || user.avatar;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdArrowBack className="text-2xl text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
              <p className="text-gray-600 text-sm mt-1">
                Kelola data profil Anda
              </p>
            </div>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess("")}
              className="mb-6"
            />
          )}

          {/* Error Alert */}
          {error && !showFirstLoginModal && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError("")}
              className="mb-6"
            />
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
                      >
                        <MdCameraAlt className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {user.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      @{user.username} • {user.role === "guru" ? "Guru" : "Siswa"}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <MdEdit /> Ubah
                  </Button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

              {/* Avatar Preview */}
              {isEditing && avatarPreview && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Avatar baru</p>
                    <p className="text-xs text-gray-500">
                      {avatarFile?.name} ({(avatarFile?.size! / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <MdClose className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}

              {/* Username */}
              <div>
                <Input
                  label="username"
                  type="text"
                  name="username"
                  placeholder="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing || isLoading || !user.can_change_username}
                  maxLength={30}
                  helperText={
                    user.can_change_username
                      ? `3-30 karakter: huruf, angka, titik, underscore (${formData.username.length}/30)`
                      : `Bisa diubah dalam ${user.days_until_username_change} hari lagi`
                  }
                />
              </div>

              {/* Nama (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  nama lengkap
                </label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Nama tidak dapat diubah</p>
              </div>

              {/* Kelas dan Jurusan (Read-only) */}
              {user.role === "siswa" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      kelas
                    </label>
                    <input
                      type="text"
                      value={user.kelas || "-"}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      jurusan
                    </label>
                    <input
                      type="text"
                      value={user.jurusan || "-"}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* Nomor Telepon */}
              <div>
                <Input
                  label="nomor telepon"
                  type="tel"
                  name="telepon"
                  placeholder="081234567890"
                  value={formData.telepon}
                  onChange={handleChange}
                  disabled={!isEditing || isLoading}
                  helperText="Opsional - gunakan format 0812..."
                />
              </div>

              {/* Password Section */}
              {isEditing && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Ganti Password (Opsional)
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      Kosongkan jika tidak ingin mengubah password
                    </p>
                  </div>

                  <Input
                    label="password baru"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    helperText="Minimal 8 karakter"
                  />

                  <div>
                    <Input
                      label="konfirmasi password"
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      error={
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? "password tidak cocok"
                          : undefined
                      }
                    />
                    {formData.confirmPassword &&
                      formData.password === formData.confirmPassword && (
                        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                          <MdCheckCircle /> password cocok
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData((prev) => ({
                        ...prev,
                        username: user.username,
                        name: user.name,
                        telepon: user.telepon || "",
                        password: "",
                        confirmPassword: "",
                      }));
                      setError("");
                      removeAvatar();
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <MdSave /> Simpan
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Notification & App Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Notifikasi & Aplikasi
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Kelola notifikasi dan pengaturan aplikasi
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Push Notification Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notifSubscribed ? (
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MdNotificationsActive className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <MdNotifications className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">Push Notification</h3>
                      <p className="text-sm text-gray-600">
                        {notifSubscribed
                          ? "Aktif - Anda akan menerima notifikasi tugas baru"
                          : "Nonaktif - Aktifkan untuk mendapat notifikasi"}
                      </p>
                    </div>
                  </div>
                  
                  {notifSupported ? (
                    <Button
                      onClick={notifSubscribed ? notifUnsubscribe : notifSubscribe}
                      variant={notifSubscribed ? "secondary" : "primary"}
                      size="sm"
                      isLoading={notifLoading}
                      className="min-w-[100px]"
                    >
                      {notifSubscribed ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-500">Tidak didukung</span>
                  )}
                </div>

                {notifError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <MdError className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{notifError}</p>
                  </div>
                )}

                {notifPermission === "denied" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Anda telah menolak izin notifikasi. Buka pengaturan browser untuk mengizinkan notifikasi.
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* PWA Install Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPwaInstalled ? "bg-green-100" : "bg-blue-100"
                  }`}>
                    <MdInstallMobile className={`w-5 h-5 ${
                      isPwaInstalled ? "text-green-600" : "text-blue-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Install Aplikasi</h3>
                    <p className="text-sm text-gray-600">
                      {isPwaInstalled
                        ? "Aplikasi sudah terinstall"
                        : "Install untuk akses lebih cepat"}
                    </p>
                  </div>
                </div>

                {isPwaInstalled ? (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <MdCheckCircle className="w-4 h-4" /> Terinstall
                  </span>
                ) : deferredPrompt ? (
                  <Button
                    onClick={handleInstallPwa}
                    variant="primary"
                    size="sm"
                    className="min-w-[100px]"
                  >
                    Install
                  </Button>
                ) : (
                  <span className="text-sm text-gray-500">
                    {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
                      ? "Terinstall"
                      : "Buka di browser"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* First Login Modal */}
      {showFirstLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdWarning className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Selamat Datang!
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Ini adalah login pertama Anda. Silakan ubah username dan password default untuk keamanan akun.
                </p>
              </div>

              {error && (
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError("")}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleFirstLoginSubmit} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
                    >
                      <MdCameraAlt className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Upload foto (opsional, maks. 10MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <Input
                  label="username baru"
                  type="text"
                  name="username"
                  placeholder="username_baru"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  helperText="Huruf, angka, titik, dan underscore"
                />

                <Input
                  label="password baru"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  helperText="Minimal 8 karakter"
                />

                <div>
                  <Input
                    label="konfirmasi password"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    error={
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                        ? "password tidak cocok"
                        : undefined
                    }
                  />
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                        <MdCheckCircle /> password cocok
                      </p>
                    )}
                </div>

                <Input
                  label="nomor telepon"
                  type="tel"
                  name="telepon"
                  placeholder="081234567890"
                  value={formData.telepon}
                  onChange={handleChange}
                  disabled={isLoading}
                  helperText="Opsional"
                />

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Simpan & Lanjutkan
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
