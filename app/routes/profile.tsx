import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../hooks";
import { Header, Alert, Button } from "../components";
import { profileService, type UserProfile, type UserPreview } from "../services/profileService";
import {
  MdPersonAdd,
  MdEdit,
  MdSearch,
  MdClose,
  MdPeople,
  MdArrowBack,
  MdCheckCircle,
  MdTrendingUp,
  MdAssignment,
  MdStar,
  MdSchool,
  MdPersonRemove,
} from "react-icons/md";

export function meta() {
  return [
    { title: "Profile - Tugas" },
    { name: "description", content: "View user profile" },
  ];
}

// Performance Chart Component
function PerformanceChart({ data }: { data: { task: string; score: number; date: string }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <MdTrendingUp className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Belum ada data performa</p>
      </div>
    );
  }

  const maxScore = 100;
  const avgScore = data.reduce((a, b) => a + b.score, 0) / data.length;
  
  return (
    <div className="space-y-6">
      {/* Average */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rata-rata</p>
          <p className="text-3xl font-semibold text-gray-900">{avgScore.toFixed(1)}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          avgScore >= 75 ? "bg-green-50 text-green-700" : 
          avgScore >= 60 ? "bg-amber-50 text-amber-700" : 
          "bg-red-50 text-red-700"
        }`}>
          {avgScore >= 75 ? "Baik" : avgScore >= 60 ? "Cukup" : "Perlu Perbaikan"}
        </div>
      </div>

      {/* Bar Chart */}
      <div>
        <p className="text-xs text-gray-400 mb-3">10 Tugas Terakhir</p>
        <div className="flex items-end gap-1 h-24">
          {data.map((item, index) => {
            const height = (item.score / maxScore) * 100;
            const getBarColor = () => {
              if (item.score >= 75) return "bg-green-500";
              if (item.score >= 60) return "bg-amber-500";
              return "bg-red-500";
            };
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                  <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                    <p className="font-medium">{item.task}</p>
                    <p className="text-gray-300 text-[10px]">{item.date}</p>
                    <p className="font-bold mt-1">{item.score}</p>
                  </div>
                </div>
                
                {/* Bar */}
                <div 
                  className={`w-full rounded-sm ${getBarColor()} transition-opacity hover:opacity-70 cursor-pointer`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// User Card Component
function UserCard({ user, onClose }: { user: UserPreview; onClose?: () => void }) {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => {
        onClose?.();
        navigate(`/profile/${user.username}`);
      }}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
    >
      <img 
        src={user.avatar} 
        alt={user.name}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-600 truncate">@{user.username}</p>
        <p className="text-xs text-gray-500 truncate">
          {user.kelas && user.jurusan ? `${user.kelas} · ${user.jurusan}` : user.role}
        </p>
      </div>
      {user.role === "guru" && (
        <MdSchool className="w-4 h-4 text-amber-500 flex-shrink-0" />
      )}
    </div>
  );
}

// Search Modal
function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await profileService.searchUsers(query);
      if (response.berhasil) {
        setResults(response.data);
      }
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [query, handleSearch]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2.5">
            <MdSearch className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau username..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <MdClose className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((user) => (
                <UserCard key={user.id} user={user} onClose={onClose} />
              ))}
            </div>
          ) : query ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Tidak ditemukan
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              Ketik nama untuk mencari
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Connections Modal
function ConnectionsModal({ 
  isOpen, 
  onClose, 
  userId, 
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: number; 
  type: "followers" | "following" 
}) {
  const [users, setUsers] = useState<UserPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = type === "followers" 
          ? await profileService.getFollowers(userId)
          : await profileService.getFollowing(userId);
        
        if (response.berhasil) {
          setUsers(response.data);
        }
      } catch {
        // Silent
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {type === "followers" ? "Followers" : "Following"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <MdClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : users.length > 0 ? (
            <div className="p-2">
              {users.map((user) => (
                <UserCard key={user.id} user={user} onClose={onClose} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              <MdPeople className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              {type === "followers" ? "Belum ada followers" : "Belum mengikuti siapapun"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Profile Component
export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Modals
  const [showSearch, setShowSearch] = useState(false);
  const [showConnections, setShowConnections] = useState<"followers" | "following" | null>(null);
  const [showBioEdit, setShowBioEdit] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioSaving, setBioSaving] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await profileService.getProfile(username);
      if (response.berhasil) {
        setProfile(response.data);
        setIsFollowing(response.data.is_following);
        setBioText(response.data.bio || "");
      } else {
        setError("Gagal memuat profil");
      }
    } catch {
      setError("Terjadi kesalahan saat memuat profil");
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [authLoading, isAuthenticated, username, navigate, fetchProfile]);

  const handleFollow = async () => {
    if (!profile) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileService.unfollow(profile.id);
        setIsFollowing(false);
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);
      } else {
        await profileService.follow(profile.id);
        setIsFollowing(true);
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
      }
    } catch {
      // Silent
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveBio = async () => {
    setBioSaving(true);
    try {
      const response = await profileService.updateBio(bioText);
      if (response.berhasil) {
        setProfile(prev => prev ? { ...prev, bio: bioText } : null);
        setShowBioEdit(false);
      }
    } catch {
      // Silent
    } finally {
      setBioSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-8">
          <Alert type="error" message={error} />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Search FAB */}
      <button
        onClick={() => setShowSearch(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
      >
        <MdSearch className="w-5 h-5" />
      </button>

      <main className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-6 text-sm"
        >
          <MdArrowBack className="w-4 h-4" />
          Kembali
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          {/* Header with avatar */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                {profile.role === "guru" && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                    <MdSchool className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{profile.name}</h1>
                <p className="text-sm text-gray-600 mb-0.5">@{profile.username}</p>
                <p className="text-xs text-gray-500">
                  <span className="capitalize">{profile.role}</span>
                  {profile.kelas && <span> · {profile.kelas}</span>}
                  {profile.jurusan && <span> · {profile.jurusan}</span>}
                </p>
                
                {/* Stats inline */}
                <div className="flex items-center gap-4 mt-3">
                  <button 
                    onClick={() => setShowConnections("followers")}
                    className="text-center"
                  >
                    <span className="font-semibold text-gray-900">{profile.followers_count}</span>
                    <span className="text-xs text-gray-500 ml-1">followers</span>
                  </button>
                  <button 
                    onClick={() => setShowConnections("following")}
                    className="text-center"
                  >
                    <span className="font-semibold text-gray-900">{profile.following_count}</span>
                    <span className="text-xs text-gray-500 ml-1">following</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4">
              {isOwnProfile ? (
                showBioEdit ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      maxLength={200}
                      placeholder="Tulis tentang dirimu..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{bioText.length}/200</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowBioEdit(false);
                            setBioText(profile.bio || "");
                          }}
                        >
                          Batal
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveBio}
                          isLoading={bioSaving}
                        >
                          Simpan
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowBioEdit(true)}
                    className="w-full text-left text-sm"
                  >
                    {profile.bio ? (
                      <p className="text-gray-700">{profile.bio}</p>
                    ) : (
                      <p className="text-gray-400 flex items-center gap-1.5">
                        <MdEdit className="w-3.5 h-3.5" />
                        Tambahkan bio...
                      </p>
                    )}
                  </button>
                )
              ) : profile.bio ? (
                <p className="text-sm text-gray-700">{profile.bio}</p>
              ) : null}
            </div>

            {/* Follow Button */}
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isFollowing
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {followLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <>
                    <MdPersonRemove className="w-4 h-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <MdPersonAdd className="w-4 h-4" />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards - Siswa Only */}
        {profile.role === "siswa" && profile.stats && (
          <>
            {/* Compact Stats Row */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                  <MdAssignment className="w-4 h-4" />
                  <span className="text-xs">Tugas</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{profile.stats.total_tasks}</p>
              </div>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                  <MdCheckCircle className="w-4 h-4" />
                  <span className="text-xs">Selesai</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{profile.stats.completed_tasks}</p>
              </div>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                  <MdStar className="w-4 h-4" />
                  <span className="text-xs">Nilai</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{profile.stats.average_score.toFixed(0)}</p>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Performa</h2>
              <PerformanceChart data={profile.stats.performance_data} />
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <ConnectionsModal 
        isOpen={showConnections !== null} 
        onClose={() => setShowConnections(null)}
        userId={profile.id}
        type={showConnections || "followers"}
      />
    </div>
  );
}
