export interface User {
  _id: string;
  username: string;
  fullName?: string;
  userType: string;
  userStatus: string;
  profileImage?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  title?: string;
  availability?: string;
  completedJobCount?: number;
  accessToken?: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  propertyType: string;
  budget: number;
  status: string;
  agentId: string;
  agentName?: string;
  bidCount: number;
  location?: string;
  experienceLevel?: string;
  jobType?: string;
  workFormat?: string[];
  salaryFrom?: number;
  salaryTo?: number;
  bumpedAt?: string;
  boostPlan?: string;
  boostExpiresAt?: string;
  createdAt?: string;
}

export interface Bid {
  _id: string;
  jobId: string;
  freelancerId: string;
  freelancerName?: string;
  freelancerAvatar?: string;
  bidAmount: number;
  coverLetter: string;
  status: string;
  createdAt?: string;
}

export interface Post {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  likeCount: number;
  viewCount: number;
  likedByUserIds?: string[];
  comments: Comment[];
  createdAt?: string;
}

export interface Comment {
  _id: string;
  text: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  otherUser?: { _id: string; name: string; avatar?: string };
  lastMessage?: string;
  updatedAt?: string;
  unreadCount?: number;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
}
