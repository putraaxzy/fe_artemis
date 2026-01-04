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
  MdMoreVert,
} from "react-icons/md";

export function meta() {
  return [
    { title: "Profile - Tugas" },
    { name: "description", content: "View user profile" },
  ];
}

// Performance Chart Component - Compact
function PerformanceChart({ data }: { data: { task: string; score: number; date: string }[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <MdTrendingUp className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-xs text-gray-500">Belum ada data performa</p>
      </div>
    );
  }

  const maxScore = 100;
  const validScores = data.filter(d => {
    const score = Number(d.score);
    return typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100;
  });

  if (validScores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <MdTrendingUp className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-xs text-gray-500">Data tidak valid</p>
      </div>
    );
  }

  const avgScore = validScores.reduce((a, b) => a + Number(b.score), 0) / validScores.length;
  const scores = validScores.map(d => Number(d.score));
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  
  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-500 rounded-lg p-3 text-center">
          <p className="text-[10px] text-emerald-100 uppercase mb-0.5 font-semibold">Rata-rata</p>
          <p className="text-lg sm:text-2xl font-bold text-white">{avgScore.toFixed(0)}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-emerald-700 uppercase mb-0.5 font-semibold">Tertinggi</p>
          <p className="text-lg sm:text-2xl font-bold text-emerald-700">{highestScore}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-emerald-700 uppercase mb-0.5 font-semibold">Terendah</p>
          <p className="text-lg sm:text-2xl font-bold text-emerald-700">{lowestScore}</p>
        </div>
      </div>

      {/* Bar Chart - Responsive */}
      <div className="w-full bg-white rounded-lg p-4 border border-emerald-200">
        <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-48 sm:h-56">
          {validScores.map((item, index) => {
            const score = Number(item.score);
            const heightPercent = (score / maxScore) * 100;
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center group relative h-full justify-end"
              >
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                  <div className="bg-emerald-500 text-white text-xs rounded-md px-2 py-1 font-semibold shadow-lg">
                    {score}
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-500"></div>
                </div>
                
                {/* Bar - SOLID COLOR NO GRADIENT */}
                <div 
                  className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600 cursor-pointer shadow-sm"
                  style={{ 
                    height: `${Math.max(heightPercent, 8)}%`,
                    minHeight: '8px'
                  }}
                  title={`${item.task} - ${score} (${item.date})`}
                />
                
                {/* Label */}
                <div className="text-[9px] text-gray-500 mt-2 text-center truncate w-full px-1">
                  {item.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>

          </div>
  );
}

// User Card Component - Compact
function UserCard({ user, onClose }: { user: UserPreview; onClose?: () => void }) {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => {
        onClose?.();
        navigate(`/profile/${user.username}`);
      }}
      className="group flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
    >
      <div className="relative">
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        {user.role === "guru" && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center ring-2 ring-white">
            <MdSchool className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
      </div>
      
      <MdArrowBack className="w-4 h-4 text-gray-300 transform rotate-180" />
    </div>
  );
}

// Search Modal - Compact
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Search Input */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200 focus-within:border-gray-400 transition-colors">
            <MdSearch className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari pengguna..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-0.5">
                <MdClose className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-1.5">
              {results.map((user) => (
                <UserCard key={user.id} user={user} onClose={onClose} />
              ))}
            </div>
          ) : query ? (
            <div className="py-8 text-center">
              <MdSearch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Tidak ditemukan</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <MdPeople className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Ketik untuk mencari</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Connections Modal - Compact
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {type === "followers" ? "Followers" : "Following"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <MdClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : users.length > 0 ? (
            <div className="p-1.5">
              {users.map((user) => (
                <UserCard key={user.id} user={user} onClose={onClose} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <MdPeople className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {type === "followers" ? "Belum ada followers" : "Belum mengikuti siapapun"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Profile Component with refined design
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
    // Validate bio length
    if (bioText.length > 200) {
      alert("Bio maksimal 200 karakter");
      return;
    }
    
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
      <div className="min-h-screen bg-gray-50 pt-14">
        <Header />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Memuat profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-14">
        <Header />
        <div className="max-w-md mx-auto px-4 py-8">
          <Alert type="error" message={error} />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      <Header />
      
      {/* Search FAB with refined design */}
      <button
        onClick={() => setShowSearch(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gray-900 text-white rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center hover:scale-105 transition-all duration-200"
      >
        <MdSearch className="w-5 h-5" />
      </button>

      <main className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-5 text-sm font-medium transition-colors group"
        >
          <MdArrowBack className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4 shadow-sm">
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-gray-100"
                />
                {profile.role === "guru" && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shadow">
                    <MdSchool className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{profile.name}</h1>
                <p className="text-sm text-gray-500 mb-2">@{profile.username}</p>
                
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-600">
                  <span className="capitalize">{profile.role}</span>
                  {profile.kelas && <span className="text-gray-300">·</span>}
                  {profile.kelas && <span>{profile.kelas}</span>}
                  {profile.jurusan && <span className="text-gray-300">·</span>}
                  {profile.jurusan && <span>{profile.jurusan}</span>}
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                  <button 
                    onClick={() => setShowConnections("followers")}
                    className="group"
                  >
                    <span className="text-base font-bold text-gray-900 group-hover:text-gray-700">
                      {profile.followers_count}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">followers</span>
                  </button>
                  <button 
                    onClick={() => setShowConnections("following")}
                    className="group"
                  >
                    <span className="text-base font-bold text-gray-900 group-hover:text-gray-700">
                      {profile.following_count}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">following</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {isOwnProfile ? (
                showBioEdit ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      maxLength={200}
                      placeholder="Ceritakan tentang dirimu..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                    className="w-full text-left group"
                  >
                    {profile.bio ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                        <MdEdit className="w-4 h-4" />
                        <span className="text-sm">Tambahkan bio...</span>
                      </div>
                    )}
                  </button>
                )
              ) : profile.bio ? (
                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
              ) : null}
            </div>

            {/* Follow Button */}
            {!isOwnProfile && (
              <div className="mt-4">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
                      Berhenti Mengikuti
                    </>
                  ) : (
                    <>
                      <MdPersonAdd className="w-4 h-4" />
                      Ikuti
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - Siswa Only */}
        {profile.role === "siswa" && profile.stats && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-2">
                  <MdAssignment className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{profile.stats.total_tasks}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-2">
                  <MdCheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{profile.stats.completed_tasks}</p>
                <p className="text-xs text-gray-500">Selesai</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center mx-auto mb-2">
                  <MdStar className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{profile.stats.average_score}</p>
                <p className="text-xs text-gray-500">Rata-rata</p>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Performa</h2>
                  <p className="text-xs text-gray-500">10 tugas terakhir</p>
                </div>
                <MdTrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <PerformanceChart data={profile.stats.performance_data} />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
      
      {showConnections && profile && (
        <ConnectionsModal 
          isOpen={!!showConnections} 
          onClose={() => setShowConnections(null)} 
          userId={profile.id}
          type={showConnections}
        />
      )}
    </div>
  );
}