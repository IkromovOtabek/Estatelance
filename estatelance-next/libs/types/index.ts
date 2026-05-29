import { UserType, UserStatus, JobStatus, JobCategory, PropertyType, BidStatus, AuthProvider, AnnouncementType } from '../enums';

// ─── User Types ───────────────────────────────────────────────────────────────

export interface PortfolioItem {
  title: string;
  imageUrl: string;
  description: string;
}

export interface FreelancerReview {
  authorName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface User {
  _id: string;
  username: string;
  userType: UserType;
  userStatus: UserStatus;
  fullName?: string;
  bio?: string;
  location?: string;
  profileImage?: string;
  followerCount?: number;
  followingCount?: number;
  profileViewCount?: number;
  authProvider?: AuthProvider;
  telegramUsername?: string;
  createdAt?: string;
  // Freelancer-only fields
  freelancerCategory?: JobCategory;
  hourlyRate?: number;
  averageRating?: number;
  completedJobCount?: number;
  skills?: string[];
  portfolio?: PortfolioItem[];
  reviews?: FreelancerReview[];
  availability?: string;
  spamReason?: string;
  // Set after login, not stored in DB
  accessToken?: string;
}

// ─── Job Types ────────────────────────────────────────────────────────────────

export interface Job {
  _id: string;
  title: string;
  description: string;
  propertyAddress?: string;
  propertyType: PropertyType;
  category: JobCategory;
  budget: number;
  status: JobStatus;
  agentId: string;
  agentName?: string;
  agentPhone?: string;
  agentAvatar?: string;
  bidCount: number;
  hiredFreelancerId?: string;
  createdAt?: string;
  salaryFrom?: number;
  salaryTo?: number;
  experience?: string;
  jobType?: string;
  workFormat?: string;
  location?: string;
}

// ─── Bid Types ────────────────────────────────────────────────────────────────

export interface Bid {
  _id: string;
  jobId: string;
  freelancerId: string;
  freelancerName?: string;
  freelancerTitle?: string;
  bidAmount: number;
  coverLetter: string;
  status: BidStatus;
  createdAt?: string;
}

// ─── Post Types ───────────────────────────────────────────────────────────────

export interface PostComment {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  body: string;
  imageUrl?: string;
  likedByUserIds: string[];
  likeCount: number;
  viewCount: number;
  comments: PostComment[];
  createdAt?: string;
}

// ─── Message Types ────────────────────────────────────────────────────────────

export interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverUsername?: string;
  receiverAvatar?: string;
  text: string;
  isRead: boolean;
  createdAt?: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface Notification {
  _id: string;
  notificationType: string;
  title: string;
  description: string;
  isRead: boolean;
  relatedItemId?: string;
  createdAt?: string;
}

// ─── Announcement Types ───────────────────────────────────────────────────────

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  announcementType: AnnouncementType;
  isActive: boolean;
  authorId: string;
  createdAt?: string;
}

// ─── Visitor Stats ────────────────────────────────────────────────────────────

export interface DailyVisitorStat {
  date: string;
  visits: number;
  uniqueVisitors: number;
  registrations: number;
  logins: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalFreelancers: number;
  totalJobs: number;
  activeJobs: number;
  totalPosts: number;
  totalAnnouncements: number;
  spammedUsers: number;
  totalBudgetPosted: number;
}
