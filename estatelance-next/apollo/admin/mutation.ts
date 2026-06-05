import { gql } from '@apollo/client';

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export const ADMIN_LOGIN = gql`
  mutation AdminLogin($input: AdminLoginInput!) {
    adminLogin(input: $input) {
      _id
      username
      userType
      userStatus
      fullName
      profileImage
      accessToken
    }
  }
`;

export const SEED_ADMIN_ACCOUNT = gql`
  mutation SeedAdminAccount($username: String!, $password: String!) {
    seedAdminAccount(username: $username, password: $password) {
      _id
      username
      userType
      accessToken
    }
  }
`;

// ─── User Management ─────────────────────────────────────────────────────────

export const ADMIN_CHANGE_USER_STATUS = gql`
  mutation AdminChangeUserStatus($input: ChangeUserStatusInput!) {
    adminChangeUserStatus(input: $input) {
      _id
      username
      userStatus
      spamReason
    }
  }
`;

export const ADMIN_CHANGE_USER_ROLE = gql`
  mutation AdminChangeUserRole($input: ChangeUserRoleInput!) {
    adminChangeUserRole(input: $input) {
      _id
      username
      userType
    }
  }
`;

export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($userId: String!) {
    adminDeleteUser(userId: $userId)
  }
`;

// ─── Content Moderation ───────────────────────────────────────────────────────

export const ADMIN_DELETE_JOB = gql`
  mutation AdminDeleteJob($jobId: String!) {
    adminDeleteJob(jobId: $jobId)
  }
`;

export const ADMIN_DELETE_POST = gql`
  mutation AdminDeletePost($postId: String!) {
    adminDeletePost(postId: $postId)
  }
`;

// ─── Announcements ────────────────────────────────────────────────────────────

export const ADMIN_CREATE_ANNOUNCEMENT = gql`
  mutation AdminCreateAnnouncement($input: CreateAnnouncementInput!) {
    adminCreateAnnouncement(input: $input) {
      _id
      title
      body
      announcementType
      isActive
      createdAt
    }
  }
`;

export const ADMIN_TOGGLE_ANNOUNCEMENT = gql`
  mutation AdminToggleAnnouncement($announcementId: String!) {
    adminToggleAnnouncement(announcementId: $announcementId) {
      _id
      isActive
    }
  }
`;

export const ADMIN_DELETE_ANNOUNCEMENT = gql`
  mutation AdminDeleteAnnouncement($announcementId: String!) {
    adminDeleteAnnouncement(announcementId: $announcementId)
  }
`;

// ─── Notifications ────────────────────────────────────────────────────────────

export const ADMIN_SEND_NOTIFICATION = gql`
  mutation AdminSendNotificationToUser($userId: String!, $title: String!, $description: String!) {
    adminSendNotificationToUser(userId: $userId, title: $title, description: $description)
  }
`;

export const ADMIN_SEND_BROADCAST = gql`
  mutation AdminSendBroadcastNotification($title: String!, $description: String!) {
    adminSendBroadcastNotification(title: $title, description: $description)
  }
`;

export const TRACK_VISIT = gql`
  mutation TrackVisit($input: TrackVisitInput!) {
    trackVisit(input: $input)
  }
`;

export const START_SESSION = gql`
  mutation StartVisitorSession($input: StartSessionInput!) {
    startVisitorSession(input: $input)
  }
`;

export const TRACK_PAGE = gql`
  mutation TrackPageView($input: TrackPageInput!) {
    trackPageView(input: $input)
  }
`;

export const PING_SESSION = gql`
  mutation PingVisitorSession($sessionId: String!) {
    pingVisitorSession(sessionId: $sessionId)
  }
`;

export const END_SESSION = gql`
  mutation EndVisitorSession($input: EndSessionInput!) {
    endVisitorSession(input: $input)
  }
`;

export const ADMIN_REMOVE_AD_TARGET = gql`
  mutation AdminRemoveAdTarget($sourceKind: String!, $sourceId: String!) {
    adminRemoveAdTarget(sourceKind: $sourceKind, sourceId: $sourceId)
  }
`;

export const ADMIN_SET_AD_TARGET_STATUS = gql`
  mutation AdminSetAdTargetStatus($sourceKind: String!, $sourceId: String!, $active: Boolean!) {
    adminSetAdTargetStatus(sourceKind: $sourceKind, sourceId: $sourceId, active: $active) {
      id
      status
      manageable
    }
  }
`;

export const ADMIN_APPROVE_BOOST_PAYMENT = gql`
  mutation AdminApproveBoostPayment($jobId: String!) {
    adminApproveBoostPayment(jobId: $jobId) {
      _id
      boostPaymentStatus
      boostPlan
      boostExpiresAt
      boostPaidAt
    }
  }
`;

export const ADMIN_REJECT_BOOST_PAYMENT = gql`
  mutation AdminRejectBoostPayment($jobId: String!, $reason: String!) {
    adminRejectBoostPayment(jobId: $jobId, reason: $reason) {
      _id
      boostPaymentStatus
      boostPaymentRejectReason
    }
  }
`;

export const ADMIN_APPROVE_PROFILE_BOOST_PAYMENT = gql`
  mutation AdminApproveProfileBoostPayment($userId: String!) {
    adminApproveProfileBoostPayment(userId: $userId) {
      _id
      boostPaymentStatus
      boostPlan
      boostExpiresAt
      boostPaidAt
    }
  }
`;

export const ADMIN_REJECT_PROFILE_BOOST_PAYMENT = gql`
  mutation AdminRejectProfileBoostPayment($userId: String!, $reason: String!) {
    adminRejectProfileBoostPayment(userId: $userId, reason: $reason) {
      _id
      boostPaymentStatus
      boostPaymentRejectReason
    }
  }
`;

