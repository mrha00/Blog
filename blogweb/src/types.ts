export interface User {
  id: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  role?: string;
}

export interface PublicUserProfile {
  id: number;
  username: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  publishedPostCount: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Comment {
  id: number;
  content: string;
  postId?: number;
  parentId?: number | null;
  userName?: string;
  userId?: number;
  authorAvatarUrl?: string;
  createdAt?: string;
  replies?: Comment[];
}

export interface Post {
  id: number;
  title: string;
  summary?: string;
  content: string;
  coverUrl?: string;
  category?: Category | string;
  categoryName?: string;
  categoryId?: number;
  tags?: Tag[] | string[];
  tagIds?: number[];
  author?: string | User;
  authorId?: number;
  authorName?: string;
  createdAt?: string;
  status?: 'published' | 'draft' | string | number;
  views?: number;
  viewCount?: number;
  readCount?: number;
  comments?: Comment[];
}
