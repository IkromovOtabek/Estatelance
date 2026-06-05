import { gql } from '@apollo/client';

// ─── Auth Mutations ───────────────────────────────────────────────────────────

export const SIGNUP = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
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

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      _id
      username
      userType
      userStatus
      fullName
      profileImage
      authProvider
      accessToken
    }
  }
`;

// Send the Telegram widget data to the backend for verification
export const LOGIN_WITH_TELEGRAM = gql`
  mutation LoginWithTelegram($input: TelegramLoginInput!) {
    loginWithTelegram(input: $input) {
      _id
      username
      userType
      userStatus
      fullName
      profileImage
      telegramUsername
      authProvider
      needsOnboarding
      accessToken
    }
  }
`;

// ─── Profile Mutations ────────────────────────────────────────────────────────

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      _id
      username
      userType
      fullName
      bio
      location
      profileImage
      freelancerCategory
      hourlyRate
      skills
      availability
      needsOnboarding
      resumeUrl
      phoneNumber
      cardNumber
      accessToken
      portfolio {
        title
        imageUrl
        description
      }
    }
  }
`;

export const TOGGLE_FOLLOW = gql`
  mutation ToggleFollow($targetUserId: String!) {
    toggleFollow(targetUserId: $targetUserId)
  }
`;

// ─── Job Mutations ────────────────────────────────────────────────────────────

export const CREATE_JOB = gql`
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      _id
      title
      description
      category
      status
      budget
      salaryFrom
      salaryTo
      experienceLevel
      jobType
      workFormat
      workSchedule
      hoursPerDay
      location
      requiredSkills
      agentName
      contactPhone
      createdAt
    }
  }
`;

export const COMPLETE_JOB = gql`
  mutation CompleteJob($jobId: String!, $hiredFreelancerId: String) {
    completeJob(jobId: $jobId, hiredFreelancerId: $hiredFreelancerId) {
      _id
      status
      hiredFreelancerId
    }
  }
`;

export const CANCEL_JOB = gql`
  mutation CancelJob($jobId: String!, $reason: String!) {
    cancelJob(jobId: $jobId, reason: $reason) {
      _id
      status
      cancelReason
    }
  }
`;

export const MARK_JOB_ACTIVE = gql`
  mutation MarkJobActive($jobId: String!) {
    markJobActive(jobId: $jobId) {
      _id
      status
    }
  }
`;

export const MARK_JOB_PAID = gql`
  mutation MarkJobPaid($jobId: String!) {
    markJobPaid(jobId: $jobId) {
      _id
      paymentDone
      paymentDoneAt
    }
  }
`;

export const ASSIGN_HIRED_FREELANCER = gql`
  mutation AssignHiredFreelancer($jobId: String!, $hiredFreelancerId: String!) {
    assignHiredFreelancer(jobId: $jobId, hiredFreelancerId: $hiredFreelancerId) {
      _id
      status
      hiredFreelancerId
    }
  }
`;

export const UPDATE_JOB = gql`
  mutation UpdateJob($jobId: String!, $input: UpdateJobInput!) {
    updateJob(jobId: $jobId, input: $input) {
      _id
      title
      description
      budget
      status
      category
      propertyType
      propertyAddress
      experienceLevel
      jobType
      workFormat
      workSchedule
      hoursPerDay
      location
      salaryFrom
      salaryTo
      requiredSkills
    }
  }
`;

export const DELETE_JOB = gql`
  mutation DeleteJob($jobId: String!) {
    deleteJob(jobId: $jobId)
  }
`;

export const SUBMIT_PROFILE_BOOST_PAYMENT = gql`
  mutation SubmitProfileBoostPayment($plan: String!, $receiptUrl: String!) {
    submitProfileBoostPayment(plan: $plan, receiptUrl: $receiptUrl) {
      _id
      boostPaymentStatus
      boostRequestedPlan
      boostReceiptUrl
      boostPaymentSubmittedAt
      boostPaymentReviewedAt
      boostPaymentRejectReason
      bumpedAt
      boostExpiresAt
      boostPlan
      boostPaidAt
      boostViewsAtStart
      profileViewCount
      followerCount
    }
  }
`;

export const SUBMIT_BOOST_PAYMENT = gql`
  mutation SubmitBoostPayment($jobId: String!, $plan: String!, $receiptUrl: String!) {
    submitBoostPayment(jobId: $jobId, plan: $plan, receiptUrl: $receiptUrl) {
      _id
      boostPaymentStatus
      boostRequestedPlan
      boostReceiptUrl
      boostPaymentSubmittedAt
      boostPaymentReviewedAt
      boostPaymentRejectReason
      bumpedAt
      boostExpiresAt
      boostPlan
      boostPaidAt
      boostViewsAtStart
      boostBidsAtStart
      viewCount
      bidCount
    }
  }
`;

export const BOOST_JOB = gql`
  mutation BoostJob($jobId: String!, $plan: String!, $paymentConfirmed: Boolean!) {
    boostJob(jobId: $jobId, plan: $plan, paymentConfirmed: $paymentConfirmed) {
      _id
      bumpedAt
      boostExpiresAt
      boostPlan
      boostPaidAt
    }
  }
`;

// ─── Bid Mutations ────────────────────────────────────────────────────────────

export const CREATE_BID = gql`
  mutation CreateBid($input: CreateBidInput!) {
    createBid(input: $input) {
      _id
      jobId
      bidAmount
      coverLetter
      status
      createdAt
    }
  }
`;

export const ACCEPT_BID = gql`
  mutation AcceptBid($bidId: String!) {
    acceptBid(bidId: $bidId) {
      _id
      status
    }
  }
`;

// ─── Post Mutations ───────────────────────────────────────────────────────────

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      _id
      title
      body
      authorName
      createdAt
    }
  }
`;

export const TOGGLE_LIKE_POST = gql`
  mutation ToggleLikePost($postId: String!) {
    toggleLikePost(postId: $postId) {
      _id
      likeCount
      likedByUserIds
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) {
      _id
      comments {
        _id
        authorId
        authorName
        authorAvatar
        text
        createdAt
      }
    }
  }
`;

// ─── Message Mutations ────────────────────────────────────────────────────────

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      _id
      senderId
      senderName
      receiverId
      text
      createdAt
    }
  }
`;

export const MARK_MESSAGES_READ = gql`
  mutation MarkMessagesAsRead($otherUserId: String!) {
    markMessagesAsRead(otherUserId: $otherUserId)
  }
`;

export const INCREMENT_JOB_VIEW = gql`
  mutation IncrementJobView($jobId: String!) {
    incrementJobView(jobId: $jobId) {
      _id
      viewCount
    }
  }
`;

// ─── Notification Mutations ───────────────────────────────────────────────────

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($notificationId: String!) {
    markNotificationRead(notificationId: $notificationId)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

// ─── Job Review Mutations ─────────────────────────────────────────────────────

export const LEAVE_REVIEW = gql`
  mutation LeaveReview($input: LeaveReviewInput!) {
    leaveReview(input: $input) {
      _id
      agentRating
      agentReviewText
      freelancerRating
      freelancerReviewText
      status
    }
  }
`;

export const REPEAT_HIRE = gql`
  mutation RepeatHire($jobId: String!) {
    repeatHire(jobId: $jobId) {
      _id
      title
      status
      createdAt
    }
  }
`;

export const DEPOSIT_ESCROW = gql`
  mutation DepositEscrow($jobId: String!, $amount: Float!) {
    depositEscrow(jobId: $jobId, amount: $amount) {
      _id
      escrowStatus
      escrowAmount
    }
  }
`;

export const RELEASE_ESCROW = gql`
  mutation ReleaseEscrow($jobId: String!) {
    releaseEscrow(jobId: $jobId) {
      _id
      escrowStatus
    }
  }
`;

// ─── Dispute Mutations ────────────────────────────────────────────────────────

export const CREATE_DISPUTE = gql`
  mutation CreateDispute($input: CreateDisputeInput!) {
    createDispute(input: $input) {
      _id
      jobId
      jobTitle
      status
      createdAt
    }
  }
`;

export const RESOLVE_DISPUTE = gql`
  mutation ResolveDispute($input: ResolveDisputeInput!) {
    resolveDispute(input: $input) {
      _id
      status
      decision
      adminNote
    }
  }
`;

// ─── AI Resume Generator ──────────────────────────────────────────────────────

export const GENERATE_RESUME = gql`
  mutation GenerateResume($input: GenerateResumeInput!) {
    generateResume(input: $input) {
      fullName
      headline
      profileImage
      location
      email
      phone
      summary
      skills
      highlights
      experience {
        role
        company
        period
        bullets
      }
      education {
        degree
        institution
        period
      }
      languages
      githubUrl
      linkedinUrl
      behanceUrl
      language
    }
  }
`;
