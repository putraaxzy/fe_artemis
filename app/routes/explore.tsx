import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks";
import { Header } from "../components";
import { profileService, type UserPreview } from "../services/profileService";
import {
  MdSearch,
  MdClose,
  MdArrowForward,
  MdSchool,
  MdPersonOutline,
  MdTrendingUp
} from "react-icons/md";

// TypeWriter Effect Component
function TypeWriter({ text, className }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

// Badge untuk peran Guru
function TeacherBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-white text-[9px] font-medium">
      <MdSchool className="w-2.5 h-2.5" />
      <span>Guru</span>
    </span>
  );
}

// User Card - Compact
function UserCard({ user }: { user: UserPreview }) {
  const navigate = useNavigate();
  const isGuru = user.role === "guru";

  return (
    <div 
      onClick={() => navigate(`/profile/${user.username}`)}
      className="group flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl cursor-pointer hover:border-zinc-400 active:scale-[0.99] transition-all"
    >
      <img 
        src={user.avatar} 
        alt={user.name}
        className="w-14 h-14 rounded-full object-cover bg-zinc-100 flex-shrink-0 ring-2 ring-zinc-100"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-900 truncate">{user.name}</h3>
          {isGuru && <TeacherBadge />}
        </div>
        <p className="text-sm text-zinc-500 truncate">@{user.username}</p>
        {(user.kelas || user.jurusan) && (
          <p className="text-sm text-zinc-400 truncate mt-1">
            {[user.kelas, user.jurusan].filter(Boolean).join(" - ")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 hidden sm:block">Lihat Profil</span>
        <MdArrowForward className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 flex-shrink-0" />
      </div>
    </div>
  );
}

// Featured Card - Larger with decoration
function FeaturedUserCard({ user }: { user: UserPreview }) {
  const navigate = useNavigate();
  const isGuru = user.role === "guru";
  
  return (
    <div 
      onClick={() => navigate(`/profile/${user.username}`)}
      className="group relative overflow-hidden flex items-center gap-4 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl cursor-pointer hover:bg-white hover:border-zinc-300 active:scale-[0.99] transition-all"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-200/30 rounded-full -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-zinc-200/20 rounded-full -ml-6 -mb-6" />
      
      <div className="relative">
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-16 h-16 rounded-full object-cover bg-zinc-200 flex-shrink-0 ring-4 ring-white"
        />
        {isGuru && (
          <div className="absolute -bottom-1 -right-1 bg-zinc-800 p-1 rounded-full">
            <MdSchool className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 relative">
        <h3 className="font-bold text-zinc-900 truncate text-lg">{user.name}</h3>
        <p className="text-sm text-zinc-500 truncate">@{user.username}</p>
        {(user.kelas || user.jurusan) && (
          <div className="mt-2 inline-flex items-center px-2 py-1 bg-zinc-200/50 rounded-md">
            <p className="text-xs font-medium text-zinc-600">
              {[user.kelas, user.jurusan].filter(Boolean).join(" - ")}
            </p>
          </div>
        )}
      </div>

      <MdArrowForward className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 flex-shrink-0 relative" />
    </div>
  );
}

// Skeleton Loading
function CardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-zinc-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-3 bg-zinc-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

// -- MAIN PAGE --

export default function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [featured, setFeatured] = useState<UserPreview[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Authentication Check
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const loadFeatured = async () => {
      try {
        const response = await profileService.searchUsers("a");
        if (response.berhasil) {
          // Mengambil 4 saja agar grid terlihat lebih clean (2x2)
          setFeatured(response.data.slice(0, 4));
        }
      } catch { /* Silent */ }
    };
    loadFeatured();
  }, [authLoading, isAuthenticated, navigate]);

  // Search Logic
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await profileService.searchUsers(query);
      if (response.berhasil) setResults(response.data);
    } catch { /* Silent */ } 
    finally { setIsLoading(false); }
  }, [query]);

  // Debounce
  useEffect(() => {
    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [query, handleSearch]);

  if (authLoading) {
    return <div className="min-h-screen bg-white" />; 
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 pt-6 pb-20">
        {/* Header with Typing Effect */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-zinc-900">
            <TypeWriter text="Explore" />
          </h1>
          <p className="text-base font-semibold text-zinc-500 mt-2">
            <TypeWriter text="Temukan guru dan teman kelas" />
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="w-5 h-5 text-zinc-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari username, nama..."
            className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm placeholder-zinc-400 rounded-lg py-2.5 pl-10 pr-10 focus:outline-none focus:bg-white focus:border-zinc-400 transition-all"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600"
            >
              <MdClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              {isLoading ? "Mencari..." : `${results.length} hasil ditemukan`}
            </p>

            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center border border-dashed border-zinc-200 rounded-xl">
                <MdPersonOutline className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Tidak ditemukan</p>
              </div>
            )}
          </div>
        )}

        {/* Featured */}
        {!hasSearched && featured.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MdTrendingUp className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-700">Disarankan</h2>
            </div>
            
            <div className="space-y-2">
              {featured.map((user) => (
                <FeaturedUserCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function meta() {
  return [
    { title: "Explore | Find Your Connections" },
    { name: "description", content: "Cari guru, teman, dan koneksi akademik." },
  ];
}