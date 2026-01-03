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
} from "react-icons/md";

export function meta() {
  return [
    { title: "Explore - Tugas" },
    { name: "description", content: "Cari dan temukan teman" },
  ];
}

// User Card Component
function UserCard({ user }: { user: UserPreview }) {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(`/profile/${user.id}`)}
      className="group bg-white rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border border-gray-100"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {user.role === "guru" && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
              <MdSchool className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate text-sm">
            {user.name}
          </p>
          <p className="text-xs text-gray-600 truncate mb-0.5">@{user.username}</p>
          <p className="text-xs text-gray-500 truncate">
            {user.kelas && `${user.kelas}`}
            {user.jurusan && ` · ${user.jurusan}`}
            {!user.kelas && !user.jurusan && user.role}
          </p>
        </div>
        <MdArrowForward className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}

// Featured User Card
function FeaturedUserCard({ user }: { user: UserPreview }) {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(`/profile/${user.id}`)}
      className="group bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          {user.role === "guru" && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
              <MdSchool className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
        <p className="font-medium text-gray-900 truncate w-full text-sm">
          {user.name}
        </p>
        <p className="text-xs text-gray-600 truncate w-full mb-0.5">@{user.username}</p>
        <p className="text-xs text-gray-500 truncate w-full">
          {user.kelas && user.jurusan ? `${user.kelas} · ${user.jurusan}` : user.kelas || user.jurusan || user.role}
        </p>
      </div>
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [featured, setFeatured] = useState<UserPreview[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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
          setFeatured(response.data.slice(0, 6));
        }
      } catch {
        // Silent
      }
    };

    loadFeatured();
  }, [authLoading, isAuthenticated, navigate]);

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
      if (response.berhasil) {
        setResults(response.data);
      }
    } catch (error) {
      // Silent error
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [query, handleSearch]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Explore</h1>
          <p className="text-sm text-gray-600">Temukan dan terhubung dengan teman</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau username..."
              className="w-full bg-white border border-gray-200 rounded-lg pl-11 pr-11 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
            />
            {query && (
              <button 
                onClick={() => setQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <MdClose className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-600">
                {isLoading ? "Mencari..." : `${results.length} hasil`}
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-3.5 bg-gray-200 rounded w-32 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <MdSearch className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Tidak ada hasil</p>
                <p className="text-xs text-gray-500">Coba kata kunci lain</p>
              </div>
            )}
          </div>
        )}

        {/* Featured Users Section */}
        {!hasSearched && featured.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-4">
              Rekomendasi untuk Anda
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {featured.map((user) => (
                <FeaturedUserCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && featured.length === 0 && !authLoading && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <MdSearch className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Mulai cari untuk menemukan teman</p>
          </div>
        )}
      </main>
    </div>
  );
}