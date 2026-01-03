/**
 * Profile Service
 * Handle profile, follow, and social features
 */

import { API_BASE_URL } from "~/config/api";

export interface UserProfile {
  id: number;
  username: string;
  name: string;
  bio: string | null;
  avatar: string;
  role: "guru" | "siswa";
  kelas: string | null;
  jurusan: string | null;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  stats: {
    total_tasks: number;
    completed_tasks: number;
    average_score: number;
    performance_data: PerformanceData[];
  } | null;
}

export interface PerformanceData {
  task: string;
  score: number;
  date: string;
}

export interface UserPreview {
  id: number;
  username: string;
  name: string;
  avatar: string;
  role: "guru" | "siswa";
  kelas: string | null;
  jurusan: string | null;
}

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: number): Promise<{ berhasil: boolean; data: UserProfile }> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Search users by name
   */
  async searchUsers(query: string): Promise<{ berhasil: boolean; data: UserPreview[] }> {
    const response = await fetch(`${API_BASE_URL}/profile/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Follow a user
   */
  async follow(userId: number): Promise<{ berhasil: boolean; pesan: string }> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}/follow`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Unfollow a user
   */
  async unfollow(userId: number): Promise<{ berhasil: boolean; pesan: string }> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}/follow`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Get followers list
   */
  async getFollowers(userId: number): Promise<{ berhasil: boolean; data: UserPreview[] }> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}/followers`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Get following list
   */
  async getFollowing(userId: number): Promise<{ berhasil: boolean; data: UserPreview[] }> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}/following`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Update bio
   */
  async updateBio(bio: string): Promise<{ berhasil: boolean; pesan: string }> {
    const response = await fetch(`${API_BASE_URL}/profile/bio`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ bio }),
    });
    return response.json();
  },
};
