import { gql } from '@apollo/client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const GET_ME = gql`
  query GetMe {
    getMe {
      _id username fullName userType userStatus
      profileImage bio skills hourlyRate title
      availability completedJobCount
    }
  }
`;

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const GET_JOBS = gql`
  query GetJobs($input: GetJobsInput!) {
    getJobs(input: $input) {
      _id title description category propertyType
      budget status agentId agentName bidCount
      location experienceLevel jobType workFormat
      salaryFrom salaryTo bumpedAt boostPlan boostExpiresAt createdAt
    }
  }
`;

export const GET_JOB_BY_ID = gql`
  query GetJobById($jobId: String!) {
    getJobById(jobId: $jobId) {
      _id title description category propertyType
      budget status agentId agentName bidCount
      location experienceLevel jobType workFormat
      workSchedule hoursPerDay salaryFrom salaryTo
      requiredSkills bumpedAt boostPlan boostExpiresAt createdAt
    }
  }
`;

export const GET_MY_JOBS = gql`
  query GetMyJobs {
    getMyJobs {
      _id title description category budget status
      bidCount propertyType location bumpedAt
      boostExpiresAt boostPlan createdAt
    }
  }
`;

export const GET_BIDS_FOR_JOB = gql`
  query GetBidsForJob($jobId: String!) {
    getBidsForJob(jobId: $jobId) {
      _id jobId freelancerId freelancerName
      bidAmount coverLetter status createdAt
    }
  }
`;

// ─── Users / Freelancers ──────────────────────────────────────────────────────
export const GET_FREELANCERS = gql`
  query GetFreelancers($input: GetUsersInput!) {
    getFreelancers(input: $input) {
      _id username fullName profileImage bio
      skills hourlyRate title availability
      completedJobCount
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: String!) {
    getUserById(userId: $userId) {
      _id username fullName profileImage bio
      skills hourlyRate title availability
      completedJobCount userType
    }
  }
`;

// ─── Posts ────────────────────────────────────────────────────────────────────
export const GET_POSTS = gql`
  query GetPosts($page: Int!, $limit: Int!) {
    getPosts(page: $page, limit: $limit) {
      _id title body imageUrl authorId authorName
      authorAvatar likeCount viewCount likedByUserIds
      comments { _id text authorId authorName authorAvatar createdAt }
      createdAt
    }
  }
`;

// ─── Messages ────────────────────────────────────────────────────────────────
export const GET_MY_CONVERSATIONS = gql`
  query GetMyConversations {
    getMyConversations {
      _id participants updatedAt
      otherUser { _id name avatar }
      lastMessage unreadCount
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: String!) {
    getMessages(conversationId: $conversationId) {
      _id conversationId senderId text createdAt
    }
  }
`;

// ─── Notifications ────────────────────────────────────────────────────────────
export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications {
    getMyNotifications {
      _id type title message isRead createdAt
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadNotificationCount {
    getUnreadNotificationCount
  }
`;
