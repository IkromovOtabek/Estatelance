import { gql } from '@apollo/client';

export const ADMIN_GET_ALL_USERS = gql`
  query AdminGetAllUsers($page: Int, $limit: Int) {
    adminGetAllUsers(page: $page, limit: $limit) {
      _id
      username
      fullName
      userType
      userStatus
      spamReason
      authProvider
      followerCount
      completedJobCount
      createdAt
    }
  }
`;

export const ADMIN_GET_ALL_JOBS = gql`
  query AdminGetAllJobs($page: Int, $limit: Int) {
    adminGetAllJobs(page: $page, limit: $limit) {
      _id
      title
      category
      status
      budget
      agentName
      bidCount
      createdAt
    }
  }
`;

export const ADMIN_GET_ALL_POSTS = gql`
  query AdminGetAllPosts($page: Int, $limit: Int) {
    adminGetAllPosts(page: $page, limit: $limit) {
      _id
      title
      authorName
      likeCount
      viewCount
      createdAt
    }
  }
`;

export const ADMIN_GET_ALL_ANNOUNCEMENTS = gql`
  query AdminGetAllAnnouncements {
    adminGetAllAnnouncements {
      _id
      title
      body
      announcementType
      isActive
      imageUrl
      createdAt
    }
  }
`;

export const ADMIN_GET_DASHBOARD_STATS = gql`
  query AdminGetDashboardStats {
    adminGetDashboardStats {
      totalUsers
      totalAgents
      totalFreelancers
      totalJobs
      activeJobs
      totalPosts
      totalAnnouncements
      spammedUsers
      totalBudgetPosted
    }
  }
`;

export const ADMIN_GET_VISITOR_STATS = gql`
  query AdminGetVisitorStats($days: Int) {
    adminGetVisitorStats(days: $days) {
      date
      visits
      registrations
      logins
    }
  }
`;

export const ADMIN_GET_TODAY_SESSIONS = gql`
  query AdminGetTodaySessions($date: String) {
    adminGetTodaySessions(date: $date) {
      sessionId
      visitorId
      device
      os
      browser
      pages { path visitedAt }
      startedAt
      lastSeenAt
      endedAt
      isOnline
      userName
    }
  }
`;

export const ADMIN_GET_DAILY_USER_DETAILS = gql`
  query AdminGetDailyUserDetails($date: String!, $event: String!) {
    adminGetDailyUserDetails(date: $date, event: $event) {
      userId
      username
      fullName
      profileImage
      userType
      event
      createdAt
    }
  }
`;

export const ADMIN_GET_AD_TARGETS = gql`
  query AdminGetAdTargets {
    adminGetAdTargets {
      id
      title
      advertiser
      type
      status
      impressions
      clicks
      targetUrl
      sourceKind
      sourceId
      boostPlan
      createdAt
      manageable
      deletable
    }
  }
`;

export const ADMIN_GET_MODERATION_CANCELLED_JOBS = gql`
  query AdminGetModerationCancelledJobs($limit: Int) {
    adminGetModerationCancelledJobs(limit: $limit) {
      _id
      title
      description
      category
      status
      budget
      agentName
      agentId
      cancelReason
      cancelledAt
      createdAt
      requiredSkills
      experienceLevel
      location
    }
  }
`;

export const ADMIN_GET_BOOST_PAYMENT_HISTORY = gql`
  query AdminGetBoostPaymentHistory($limit: Int) {
    adminGetBoostPaymentHistory(limit: $limit) {
      boostKind
      agentName
      agentUsername
      profile {
        _id
        username
        fullName
        userType
        boostRequestedPlan
        boostPlan
        boostPaymentStatus
        boostReceiptUrl
        boostPaymentSubmittedAt
        boostPaymentReviewedAt
        boostPaymentRejectReason
        profileViewCount
        followerCount
      }
      job {
        _id
        title
        status
        boostRequestedPlan
        boostPlan
        boostPaymentStatus
        boostReceiptUrl
        boostPaymentSubmittedAt
        boostPaymentReviewedAt
        boostPaymentRejectReason
        agentName
        budget
        bidCount
      }
    }
  }
`;

export const ADMIN_GET_PENDING_BOOST_PAYMENTS = gql`
  query AdminGetPendingBoostPayments {
    adminGetPendingBoostPayments {
      boostKind
      agentName
      agentUsername
      profile {
        _id
        username
        fullName
        userType
        boostRequestedPlan
        boostReceiptUrl
        boostPaymentSubmittedAt
        profileViewCount
        followerCount
      }
      job {
        _id
        title
        status
        boostRequestedPlan
        boostReceiptUrl
        boostPaymentSubmittedAt
        agentId
        agentName
        budget
        bidCount
      }
    }
  }
`;

// Public query — available to all users
export const GET_ACTIVE_ANNOUNCEMENTS = gql`
  query GetActiveAnnouncements {
    getActiveAnnouncements {
      _id
      title
      body
      imageUrl
      announcementType
      createdAt
    }
  }
`;
