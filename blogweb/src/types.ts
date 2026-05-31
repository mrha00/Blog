export interface User {
  id: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  email?: string;
  role?: string;
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
  post_id?: number;
  parentId?: number | null;
  parent_id?: number | null;
  author?: string;
  userName?: string;
  username?: string;
  userId?: number;
  user_id?: number;
  authorAvatarUrl?: string;
  createdAt?: string;
  created_at?: string;
  // Frontend virtual property for nested comments
  replies?: Comment[];
}

export interface Post {
  id: number;
  title: string;
  summary?: string;
  excerpt?: string; // fallback
  content: string;
  coverImage?: string;
  cover_image?: string; // fallback
  cover?: string; // fallback
  coverUrl?: string; // fallback
  category?: Category | string;
  categoryName?: string;
  categoryId?: number;
  category_id?: number;
  tags?: Tag[] | string[];
  tagIds?: number[];
  tag_ids?: number[];
  author?: string | User;
  authorId?: number;
  author_id?: number;
  authorName?: string;
  createdAt?: string;
  created_at?: string;
  status?: 'published' | 'draft' | string | number;
  isPublished?: boolean;
  views?: number;
  viewCount?: number;
  readCount?: number;
  comments?: Comment[];
}
