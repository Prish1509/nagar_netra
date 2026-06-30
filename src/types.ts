export interface Report {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userBadge: string;
  imageUrl: string;
  title: string;
  description: string;
  issueType: string;
  severity: number;
  severityLabel: 'Low' | 'Medium' | 'High' | 'Critical';
  latitude: number;
  longitude: number;
  address: string;
  status: 'Reported' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved';
  verificationCount: number;
  verifiedBy?: string[]; // IDs of users who verified this report
  department: string;
  estimatedDimensions: string;
  safetyRisk: 'Low' | 'Medium' | 'High';
  affectedArea: string;
  urgencyReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  points: number;
  badges: string[];
  reportCount: number;
  verificationCount: number;
  trustScore: number;
  joinedAt: string;
}

export interface Verification {
  id: string;
  reportId: string;
  userId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface PredictionHotspot {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  probability: number;
  predictedIssueType: string;
  reasoning: string;
  severityLabel: 'Low' | 'Medium' | 'High' | 'Critical';
}
