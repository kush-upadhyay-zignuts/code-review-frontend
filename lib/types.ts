export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ReviewIssue {
  title: string;
  category: string;
  type: string;
  severity: IssueSeverity;
  line: number | null;
  explanation: string;
  message: string;
  evidence: string;
  suggestedFix: string;
  suggestion: string;
  confidence: number;
}

export interface ReviewMetrics {
  codeQualityScore: number;
  securityScore: number;
  maintainabilityScore: number;
}

export interface ReviewSummary {
  overallScore: number;
  summary: string;
  metrics?: ReviewMetrics;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  used: number;
  monthlyUsed: number;
  monthlyBudget: number;
  monthlyRemaining: number;
}

export interface UserProfile {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  tokenUsage: number;
}

export interface UserAccountDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  tokenUsage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalReviews: number;
  totalTokens: number;
  averageScore: number;
  averageResponseTimeMs: number;
  monthlyUsed: number;
  monthlyBudget: number;
  monthlyRemaining: number;
  topLanguages: { language: string; count: number }[];
}

export interface ReviewHistoryItem {
  _id: string;
  language: string;
  overallScore: number;
  totalTokens: number;
  createdAt: string;
  result?: {
    summary: string;
    overallScore: number;
    issues: ReviewIssue[];
  };
}

export interface PaginatedReviewHistory {
  items: ReviewHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'csharp',
  'php',
  'ruby',
  'kotlin',
  'swift',
  'other',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type ReviewPhase =
  | 'analyzing_syntax'
  | 'checking_security'
  | 'checking_performance'
  | 'checking_style'
  | 'validating_findings';

export const REVIEW_PHASES: { id: ReviewPhase; label: string }[] = [
  { id: 'analyzing_syntax', label: 'Analyzing syntax' },
  { id: 'checking_security', label: 'Checking security' },
  { id: 'checking_performance', label: 'Finding performance issues' },
  { id: 'checking_style', label: 'Checking style & best practices' },
  { id: 'validating_findings', label: 'Confirming issues' },
];
