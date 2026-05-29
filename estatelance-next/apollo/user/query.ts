import { gql } from '@apollo/client';

// ─── User Queries ─────────────────────────────────────────────────────────────

export const GET_MY_PROFILE = gql`
  query GetMyProfile {
    getMyProfile {
      _id
      username
      userType
      userStatus
      fullName
      bio
      location
      profileImage
      followerCount
      followingCount
      profileViewCount
      authProvider
      telegramUsername
      freelancerCategory
      hourlyRate
      averageRating
      completedJobCount
      skills
      portfolio {
        title
        imageUrl
        description
      }
      reviews {
        authorName
        rating
        reviewText
        createdAt
      }
      availability
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: String!) {
    getUserById(userId: $userId) {
      _id
      username
      fullName
      bio
      location
      profileImage
      userType
      userStatus
      followerCount
      followingCount
      profileViewCount
      freelancerCategory
      hourlyRate
      averageRating
      completedJobCount
      skills
      portfolio {
        title
        imageUrl
        description
      }
      reviews {
        authorName
        rating
        reviewText
        createdAt
      }
      availability
    }
  }
`;

export const CHECK_IS_FOLLOWING = gql`
  query CheckIsFollowing($targetUserId: String!) {
    checkIsFollowing(targetUserId: $targetUserId)
  }
`;

export const GET_FREELANCERS = gql`
  query GetFreelancers($input: GetFreelancersInput!) {
    getFreelancers(input: $input) {
      _id
      username
      fullName
      bio
      profileImage
      location
      userType
      freelancerCategory
      hourlyRate
      averageRating
      completedJobCount
      skills
      availability
    }
  }
`;

// ─── Job Queries ──────────────────────────────────────────────────────────────

export const GET_JOBS = gql`
  query GetJobs($input: GetJobsInput!) {
    getJobs(input: $input) {
      _id
      title
      description
      category
      propertyType
      propertyAddress
      budget
      status
      agentId
      agentName
      bidCount
      createdAt
    }
  }
`;

export const GET_JOB_BY_ID = gql`
  query GetJobById($jobId: String!) {
    getJobById(jobId: $jobId) {
      _id
      title
      description
      category
      propertyType
      propertyAddress
      budget
      status
      agentId
      agentName
      bidCount
      hiredFreelancerId
      createdAt
    }
  }
`;

export const GET_MY_JOBS = gql`
  query GetMyJobs {
    getMyJobs {
      _id
      title
      description
      category
      budget
      status
      bidCount
      propertyType
      location
      createdAt
    }
  }
`;

export const GET_BIDS_FOR_JOB = gql`
  query GetBidsForJob($jobId: String!) {
    getBidsForJob(jobId: $jobId) {
      _id
      jobId
      freelancerId
      freelancerName
      bidAmount
      coverLetter
      status
      createdAt
    }
  }
`;

export const GET_MY_BIDS = gql`
  query GetMyBids {
    getMyBids {
      _id
      jobId
      bidAmount
      coverLetter
      status
      createdAt
    }
  }
`;

// ─── Post Queries ─────────────────────────────────────────────────────────────

export const GET_POSTS = gql`
  query GetPosts($page: Int, $limit: Int) {
    getPosts(page: $page, limit: $limit) {
      _id
      title
      body
      imageUrl
      authorId
      authorName
      authorAvatar
      likeCount
      likedByUserIds
      viewCount
      comments {
        _id
        authorName
        authorAvatar
        text
        createdAt
      }
      createdAt
    }
  }
`;

// ─── Message Queries ──────────────────────────────────────────────────────────

export const GET_CONVERSATION = gql`
  query GetConversation($otherUserId: String!) {
    getConversation(otherUserId: $otherUserId) {
      _id
      senderId
      senderName
      senderUsername
      senderAvatar
      receiverId
      receiverName
      receiverUsername
      receiverAvatar
      text
      isRead
      createdAt
    }
  }
`;

export const GET_MY_CONVERSATIONS = gql`
  query GetMyConversations {
    getMyConversations {
      _id
      senderId
      senderName
      senderUsername
      senderAvatar
      receiverId
      receiverName
      receiverUsername
      receiverAvatar
      text
      isRead
      createdAt
    }
  }
`;

export const GET_UNREAD_MESSAGE_COUNT = gql`
  query GetUnreadMessageCount {
    getUnreadMessageCount
  }
`;

// ─── Notification Queries ─────────────────────────────────────────────────────

export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications {
    getMyNotifications {
      _id
      notificationType
      title
      description
      isRead
      relatedItemId
      createdAt
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    getUnreadNotificationCount
  }
`;
