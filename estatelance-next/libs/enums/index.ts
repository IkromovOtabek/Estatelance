// These enums mirror the backend enums — keep them in sync!

export enum UserType {
  AGENT = 'AGENT',
  FREELANCER = 'FREELANCER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SPAM = 'SPAM',
  DELETED = 'DELETED',
}

export enum JobStatus {
  OPEN = 'OPEN',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum JobCategory {
  VISUALS     = 'VISUALS',
  STAGING     = 'STAGING',
  MARKETING   = 'MARKETING',
  LEGAL       = 'LEGAL',
  RENDERING   = 'RENDERING',
  DESIGN      = 'DESIGN',
  REPAIR      = 'REPAIR',
  CLEANING    = 'CLEANING',
  INSPECTION  = 'INSPECTION',
  IT          = 'IT',
  TRANSLATION = 'TRANSLATION',
  MOVING      = 'MOVING',
  ACCOUNTING  = 'ACCOUNTING',
  SECURITY    = 'SECURITY',
  OTHER       = 'OTHER',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  VILLA = 'VILLA',
  COMMERCIAL = 'COMMERCIAL',
  LAND = 'LAND',
}

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export enum AuthProvider {
  EMAIL = 'EMAIL',
  TELEGRAM = 'TELEGRAM',
}

export enum FreelancerAvailability {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
}

export enum AnnouncementType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ADVERTISEMENT = 'ADVERTISEMENT',
}

// Human-readable labels for displaying categories in the UI (O'zbek tili)
export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  [JobCategory.VISUALS]:     'Foto & Dron video',
  [JobCategory.STAGING]:     'Virtual Staging',
  [JobCategory.MARKETING]:   'SMM & Kontent',
  [JobCategory.LEGAL]:       'Yuridik & Kadastr',
  [JobCategory.RENDERING]:   '3D Vizualizatsiya',
  [JobCategory.DESIGN]:      'Interyer dizayn',
  [JobCategory.REPAIR]:      'Ta\'mirlash & Remont',
  [JobCategory.CLEANING]:    'Tozalash xizmatlari',
  [JobCategory.INSPECTION]:  'Ko\'rikdan o\'tkazish',
  [JobCategory.IT]:          'IT & Dasturlash',
  [JobCategory.TRANSLATION]: 'Tarjima xizmatlari',
  [JobCategory.MOVING]:      'Ko\'chish & Yuk tashish',
  [JobCategory.ACCOUNTING]:  'Buxgalteriya & Hisob',
  [JobCategory.SECURITY]:    'Qo\'riqlash xizmati',
  [JobCategory.OTHER]:       'Boshqa xizmatlar',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'House / Villa',
  [PropertyType.COMMERCIAL]: 'Commercial Space',
  [PropertyType.LAND]: 'Land Plot',
};
