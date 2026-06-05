import { registerEnumType } from '@nestjs/graphql';

// ─── User Role ────────────────────────────────────────────────────────────────
// Every user on EstateLance has one of these roles
export enum UserType {
  AGENT = 'AGENT',           // Real estate agent or broker who posts jobs
  FREELANCER = 'FREELANCER', // Professional who bids on and completes jobs
  ADMIN = 'ADMIN',           // Platform administrator
}
registerEnumType(UserType, { name: 'UserType' });

// ─── User Account Status ──────────────────────────────────────────────────────
export enum UserStatus {
  ACTIVE = 'ACTIVE',   // Normal account, can do everything
  SPAM = 'SPAM',       // Blocked by admin, read-only access
  DELETED = 'DELETED', // Soft-deleted account
}
registerEnumType(UserStatus, { name: 'UserStatus' });

// ─── Job (Project) Status ─────────────────────────────────────────────────────
export enum JobStatus {
  OPEN = 'OPEN',           // Accepting bids from freelancers
  ACTIVE = 'ACTIVE',       // A bid was accepted, work in progress
  COMPLETED = 'COMPLETED', // Job is done
  CANCELLED = 'CANCELLED', // Agent cancelled the job
}
registerEnumType(JobStatus, { name: 'JobStatus' });

// ─── Job Category ─────────────────────────────────────────────────────────────
// The type of service being requested
export enum JobCategory {
  VISUALS    = 'VISUALS',     // Photography and drone video
  STAGING    = 'STAGING',     // 3D virtual staging
  MARKETING  = 'MARKETING',   // SMM and copywriting
  LEGAL      = 'LEGAL',       // Legal / cadastre consulting
  RENDERING  = 'RENDERING',   // 3D exterior rendering
  DESIGN     = 'DESIGN',      // Interior design
  REPAIR     = 'REPAIR',      // Repair and renovation
  CLEANING   = 'CLEANING',    // Cleaning services
  INSPECTION = 'INSPECTION',  // Property inspection / appraisal
  IT         = 'IT',          // IT, websites, CRM for real estate
  TRANSLATION= 'TRANSLATION', // Document translation
  MOVING     = 'MOVING',      // Moving and hauling
  ACCOUNTING = 'ACCOUNTING',  // Bookkeeping and accounting
  SECURITY   = 'SECURITY',    // Security systems / guard service
  OTHER      = 'OTHER',       // Anything else
}
registerEnumType(JobCategory, { name: 'JobCategory' });

// ─── Property Type ────────────────────────────────────────────────────────────
// What kind of real estate is involved in the job
export enum PropertyType {
  APARTMENT  = 'APARTMENT',
  VILLA      = 'VILLA',
  COMMERCIAL = 'COMMERCIAL',
  LAND       = 'LAND',
  OTHER      = 'OTHER',
}
registerEnumType(PropertyType, { name: 'PropertyType' });

// ─── Bid (Proposal) Status ────────────────────────────────────────────────────
export enum BidStatus {
  PENDING = 'PENDING',     // Freelancer submitted, waiting for agent decision
  ACCEPTED = 'ACCEPTED',   // Agent accepted this bid
  DECLINED = 'DECLINED',   // Agent chose another freelancer
}
registerEnumType(BidStatus, { name: 'BidStatus' });

// ─── Boost to'lov (chek) holati ───────────────────────────────────────────────
export enum BoostPaymentStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
registerEnumType(BoostPaymentStatus, { name: 'BoostPaymentStatus' });

// ─── Freelancer Availability ─────────────────────────────────────────────────
export enum FreelancerAvailability {
  AVAILABLE = 'AVAILABLE', // Can take new jobs
  BUSY = 'BUSY',           // Currently working on a job
}
registerEnumType(FreelancerAvailability, { name: 'FreelancerAvailability' });

// ─── Notification Type ────────────────────────────────────────────────────────
export enum NotificationType {
  BID = 'BID',           // Someone bid on your job
  MESSAGE = 'MESSAGE',   // You got a direct message
  FOLLOW = 'FOLLOW',     // Someone followed your profile
  LIKE = 'LIKE',         // Someone liked your post
  SYSTEM = 'SYSTEM',     // Platform announcement
}
registerEnumType(NotificationType, { name: 'NotificationType' });

// ─── Auth Provider ────────────────────────────────────────────────────────────
// How the user signed up
export enum AuthProvider {
  EMAIL    = 'EMAIL',    // Traditional email + password
  TELEGRAM = 'TELEGRAM', // Signed up via Telegram Login
  GOOGLE   = 'GOOGLE',   // Signed up via Google OAuth
}
registerEnumType(AuthProvider, { name: 'AuthProvider' });

// ─── Announcement Type ────────────────────────────────────────────────────────
export enum AnnouncementType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ADVERTISEMENT = 'ADVERTISEMENT',
}
registerEnumType(AnnouncementType, { name: 'AnnouncementType' });

// ─── Dispute Status ───────────────────────────────────────────────────────────
export enum DisputeStatus {
  OPEN = 'OPEN',           // Filed, waiting for admin review
  UNDER_REVIEW = 'UNDER_REVIEW', // Admin is reviewing
  RESOLVED = 'RESOLVED',   // Admin made a decision
  CLOSED = 'CLOSED',       // Closed without resolution
}
registerEnumType(DisputeStatus, { name: 'DisputeStatus' });

// ─── Dispute Decision ─────────────────────────────────────────────────────────
export enum DisputeDecision {
  FAVOR_AGENT = 'FAVOR_AGENT',           // Escrow returned to agent
  FAVOR_FREELANCER = 'FAVOR_FREELANCER', // Escrow released to freelancer
  SPLIT = 'SPLIT',                       // Escrow split between both
}
registerEnumType(DisputeDecision, { name: 'DisputeDecision' });

// ─── Escrow Status ────────────────────────────────────────────────────────────
export enum EscrowStatus {
  NONE = 'NONE',           // No escrow (direct payment)
  HELD = 'HELD',           // Funds held in escrow
  RELEASED = 'RELEASED',   // Funds released to freelancer
  REFUNDED = 'REFUNDED',   // Funds returned to agent
  DISPUTED = 'DISPUTED',   // Under dispute
}
registerEnumType(EscrowStatus, { name: 'EscrowStatus' });
