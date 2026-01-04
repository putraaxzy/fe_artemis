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
      className="group relative flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-900 hover:shadow-lg hover:shadow-zinc-900/5 active:scale-[0.98] transition-all duration-300 overflow-hidden"
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Avatar with animated ring */}
      <div className="relative flex-shrink-0">
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-11 h-11 rounded-full object-cover bg-zinc-100 ring-2 ring-zinc-100 group-hover:ring-zinc-900 transition-all duration-300"
        />
        {isGuru && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-zinc-900 p-1 rounded-full ring-2 ring-white shadow-sm">
            <MdSchool className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 relative z-10">
        <h3 className="font-bold text-sm text-zinc-900 truncate group-hover:text-zinc-950 transition-colors">{user.name}</h3>
        <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
        {(user.kelas || user.jurusan) && (
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {[user.kelas, user.jurusan].filter(Boolean).join(" - ")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 relative z-10">
        <MdArrowForward className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
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
      className="group relative overflow-hidden flex items-center gap-3 p-4 bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-900 hover:shadow-xl hover:shadow-zinc-900/10 active:scale-[0.98] transition-all duration-300"
    >
      {/* Animated background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-zinc-900/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-zinc-900/3 rounded-full -ml-6 -mb-6 group-hover:scale-125 transition-transform duration-500" />
      
      <div className="relative">
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover bg-zinc-200 flex-shrink-0 ring-2 ring-white group-hover:ring-zinc-900 transition-all duration-300 shadow-md"
        />
        {isGuru && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-zinc-900 p-1 rounded-full ring-2 ring-white shadow-sm">
            <MdSchool className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 relative z-10">
        <h3 className="font-bold text-zinc-900 truncate group-hover:text-zinc-950 transition-colors">{user.name}</h3>
        <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
        {(user.kelas || user.jurusan) && (
          <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-zinc-900/5 group-hover:bg-zinc-900/10 rounded-md transition-colors">
            <p className="text-xs font-medium text-zinc-700">
              {[user.kelas, user.jurusan].filter(Boolean).join(" - ")}
            </p>
          </div>
        )}
      </div>

      <MdArrowForward className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-1 flex-shrink-0 relative z-10 transition-all duration-300" />
    </div>
  );
}

// Skeleton Loading
function CardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-zinc-200 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-zinc-200 rounded w-1/3" />
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
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari username, nama..."
            className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm placeholder-zinc-400 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:bg-white focus:border-zinc-900 focus:shadow-lg focus:shadow-zinc-900/5 transition-all duration-300"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all duration-200"
            >
              <MdClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <p className="text-xs font-medium text-zinc-500 px-1">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-1 h-1 bg-zinc-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block w-1 h-1 bg-zinc-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block w-1 h-1 bg-zinc-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  Mencari
                </span>
              ) : (
                `${results.length} hasil ditemukan`
              )}
            </p>

            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((user, index) => (
                  <div 
                    key={user.id}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <UserCard user={user} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 animate-in fade-in duration-300">
                <MdPersonOutline className="w-12 h-12 text-zinc-300 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-medium text-zinc-600">Tidak ditemukan</p>
                <p className="text-xs text-zinc-400 mt-1">Coba kata kunci lain</p>
              </div>
            )}
          </div>
        )}

        {/* Featured */}
        {!hasSearched && featured.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-4 px-1">
              <MdTrendingUp className="w-4 h-4 text-zinc-600" />
              <h2 className="text-sm font-bold text-zinc-800">Disarankan</h2>
            </div>
            
            <div className="space-y-2">
              {featured.map((user, index) => (
                <div 
                  key={user.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <FeaturedUserCard user={user} />
                </div>
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