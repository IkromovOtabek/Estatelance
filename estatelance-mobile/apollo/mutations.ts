import { gql } from '@apollo/client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      _id username fullName userType userStatus
      profileImage accessToken
    }
  }
`;

export const CREATE_GOOGLE_AUTH_TOKEN = gql`
  mutation CreateGoogleAuthToken {
    createGoogleAuthToken
  }
`;

export const CREATE_TELEGRAM_AUTH_TOKEN = gql`
  mutation CreateTelegramAuthToken {
    createTelegramAuthToken
  }
`;

export const TELEGRAM_LOGIN = gql`
  mutation LoginWithTelegram($input: TelegramLoginInput!) {
    loginWithTelegram(input: $input) {
      _id username fullName userType userStatus
      profileImage accessToken
    }
  }
`;

export const SIGNUP = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      _id username fullName userType userStatus
      profileImage accessToken needsOnboarding
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      _id username fullName profileImage bio userType
      skills hourlyRate freelancerCategory availability
      needsOnboarding accessToken
    }
  }
`;

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const CREATE_JOB = gql`
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      _id title budget status createdAt
    }
  }
`;

export const UPDATE_JOB = gql`
  mutation UpdateJob($jobId: String!, $input: UpdateJobInput!) {
    updateJob(jobId: $jobId, input: $input) {
      _id title description budget status
    }
  }
`;

export const DELETE_JOB = gql`
  mutation DeleteJob($jobId: String!) {
    deleteJob(jobId: $jobId)
  }
`;

export const COMPLETE_JOB = gql`
  mutation CompleteJob($jobId: String!) {
    completeJob(jobId: $jobId) { _id status }
  }
`;

export const BOOST_JOB = gql`
  mutation BoostJob($jobId: String!, $plan: String!) {
    boostJob(jobId: $jobId, plan: $plan) {
      _id bumpedAt boostExpiresAt boostPlan
    }
  }
`;

// ─── Bids ─────────────────────────────────────────────────────────────────────
export const CREATE_BID = gql`
  mutation CreateBid($input: CreateBidInput!) {
    createBid(input: $input) {
      _id jobId bidAmount coverLetter status createdAt
    }
  }
`;

export const ACCEPT_BID = gql`
  mutation AcceptBid($bidId: String!) {
    acceptBid(bidId: $bidId) { _id status }
  }
`;

// ─── Posts ────────────────────────────────────────────────────────────────────
export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) { _id title createdAt }
  }
`;

export const TOGGLE_LIKE_POST = gql`
  mutation ToggleLikePost($postId: String!) {
    toggleLikePost(postId: $postId) { _id likeCount likedByUserIds }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) { _id text authorName createdAt }
  }
`;

// ─── Messages ─────────────────────────────────────────────────────────────────
export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      _id senderId senderName receiverId receiverName text isRead createdAt
    }
  }
`;

export const MARK_MESSAGES_AS_READ = gql`
  mutation MarkMessagesAsRead($otherUserId: String!) {
    markMessagesAsRead(otherUserId: $otherUserId)
  }
`;

// ─── Notifications ────────────────────────────────────────────────────────────
export const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsAsRead {
    markNotificationsAsRead
  }
`;

// ─── Follow ───────────────────────────────────────────────────────────────────
export const TOGGLE_FOLLOW = gql`
  mutation ToggleFollow($targetUserId: String!) {
    toggleFollow(targetUserId: $targetUserId)
  }
`;
