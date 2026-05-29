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
