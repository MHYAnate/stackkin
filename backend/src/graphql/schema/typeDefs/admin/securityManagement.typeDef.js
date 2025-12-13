// apps/backend/src/graphql/schema/typeDefs/admin/securityManagement.typeDef.js

import { gql } from 'apollo-server-express';

const securityManagementTypeDef = gql`
  # ============================================
  # ENUMS
  # ============================================

  enum SecurityIncidentType {
    BRUTE_FORCE_ATTACK
    SUSPICIOUS_LOGIN
    ACCOUNT_TAKEOVER_ATTEMPT
    DATA_BREACH_ATTEMPT
    API_ABUSE
    SQL_INJECTION_ATTEMPT
    XSS_ATTEMPT
    CSRF_ATTEMPT
    DDoS_ATTACK
    UNAUTHORIZED_ACCESS
    PRIVILEGE_ESCALATION
    MALWARE_DETECTED
    PHISHING_ATTEMPT
    SPAM_ACTIVITY
    RATE_LIMIT_VIOLATION
    INVALID_TOKEN_USAGE
    SESSION_HIJACK_ATTEMPT
    PASSWORD_SPRAY
    CREDENTIAL_STUFFING
    BOT_ACTIVITY
  }

  enum SecurityIncidentSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
    EMERGENCY
  }

  enum SecurityIncidentStatus {
    DETECTED
    INVESTIGATING
    CONFIRMED
    CONTAINED
    MITIGATED
    RESOLVED
    FALSE_POSITIVE
    ESCALATED
  }

  enum IPBlockReason {
    BRUTE_FORCE
    DDoS
    SPAM
    MALICIOUS_ACTIVITY
    POLICY_VIOLATION
    MANUAL_BLOCK
    GEO_RESTRICTION
    BOT_ACTIVITY
    FRAUD_PREVENTION
    COMPLIANCE
  }

  enum IPBlockStatus {
    ACTIVE
    EXPIRED
    RELEASED
    PERMANENT
  }

  enum SessionStatus {
    ACTIVE
    EXPIRED
    REVOKED
    SUSPICIOUS
  }

  enum DeviceType {
    DESKTOP
    MOBILE
    TABLET
    BOT
    UNKNOWN
  }

  enum RateLimitScope {
    GLOBAL
    IP
    USER
    ENDPOINT
    API_KEY
    SUBSCRIPTION_TIER
  }

  enum SecurityPolicyType {
    PASSWORD
    LOGIN
    SESSION
    TWO_FACTOR
    API_ACCESS
    DATA_ACCESS
    FILE_UPLOAD
    RATE_LIMIT
  }

  enum AuditLogAction {
    LOGIN_SUCCESS
    LOGIN_FAILURE
    LOGOUT
    PASSWORD_CHANGE
    PASSWORD_RESET
    EMAIL_CHANGE
    TWO_FACTOR_ENABLE
    TWO_FACTOR_DISABLE
    ACCOUNT_LOCK
    ACCOUNT_UNLOCK
    PERMISSION_CHANGE
    ROLE_CHANGE
    DATA_EXPORT
    DATA_DELETE
    ADMIN_ACTION
    API_KEY_CREATE
    API_KEY_REVOKE
    SETTINGS_CHANGE
    SECURITY_SETTING_CHANGE
    SUSPICIOUS_ACTIVITY
  }

  enum TwoFactorMethod {
    TOTP
    SMS
    EMAIL
    BACKUP_CODE
    HARDWARE_KEY
  }

  enum FirewallRuleAction {
    ALLOW
    BLOCK
    CHALLENGE
    RATE_LIMIT
    LOG_ONLY
  }

  enum ComplianceStatus {
    COMPLIANT
    NON_COMPLIANT
    PENDING_REVIEW
    NEEDS_ATTENTION
    EXEMPT
  }

  enum ThreatLevel {
    NONE
    LOW
    MODERATE
    ELEVATED
    SEVERE
    CRITICAL
  }

  enum SecurityAlertType {
    INCIDENT
    THRESHOLD_BREACH
    POLICY_VIOLATION
    ANOMALY_DETECTED
    SYSTEM_WARNING
    COMPLIANCE_ISSUE
    MAINTENANCE_REQUIRED
  }

  enum SecuritySortField {
    CREATED_AT
    SEVERITY
    STATUS
    TYPE
    INCIDENT_DATE
  }

  # ============================================
  # TYPES
  # ============================================

  type SecurityIncident {
    id: ID!
    type: SecurityIncidentType!
    severity: SecurityIncidentSeverity!
    status: SecurityIncidentStatus!
    
    # Details
    title: String!
    description: String!
    
    # Source
    sourceIP: String
    sourceCountry: String
    sourceCity: String
    userAgent: String
    
    # Target
    targetUser: User
    targetEndpoint: String
    targetResource: String
    
    # Evidence
    requestPayload: JSON
    headers: JSON
    rawLog: String
    indicators: [ThreatIndicator!]!
    
    # Timeline
    detectedAt: DateTime!
    confirmedAt: DateTime
    resolvedAt: DateTime
    
    # Response
    responseActions: [IncidentResponseAction!]!
    
    # Assignment
    assignedTo: Admin
    escalatedTo: Admin
    
    # Notes
    notes: [IncidentNote!]!
    
    # Meta
    relatedIncidents: [SecurityIncident!]
    tags: [String!]
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ThreatIndicator {
    type: String!
    value: String!
    confidence: Float!
    source: String
    firstSeen: DateTime!
    lastSeen: DateTime!
  }

  type IncidentResponseAction {
    id: ID!
    action: String!
    performedBy: Admin!
    performedAt: DateTime!
    result: String
    automated: Boolean!
  }

  type IncidentNote {
    id: ID!
    content: String!
    author: Admin!
    createdAt: DateTime!
    isPrivate: Boolean!
  }

  type IPBlock {
    id: ID!
    ipAddress: String!
    ipRange: String
    reason: IPBlockReason!
    status: IPBlockStatus!
    
    # Details
    description: String
    
    # Geolocation
    country: String
    city: String
    isp: String
    
    # Timing
    blockedAt: DateTime!
    expiresAt: DateTime
    releasedAt: DateTime
    
    # Related
    relatedIncident: SecurityIncident
    
    # Stats
    blockedRequests: Int!
    lastAttempt: DateTime
    
    # Admin
    blockedBy: Admin!
    releasedBy: Admin
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type IPWhitelist {
    id: ID!
    ipAddress: String!
    ipRange: String
    description: String!
    
    # Association
    associatedUser: User
    associatedService: String
    
    # Timing
    validFrom: DateTime!
    validUntil: DateTime
    
    # Admin
    addedBy: Admin!
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserSession {
    id: ID!
    user: User!
    status: SessionStatus!
    
    # Session Info
    sessionToken: String!
    refreshToken: String
    
    # Device Info
    deviceType: DeviceType!
    deviceName: String
    browser: String
    browserVersion: String
    os: String
    osVersion: String
    
    # Location
    ipAddress: String!
    country: String
    city: String
    
    # Timing
    createdAt: DateTime!
    lastActivityAt: DateTime!
    expiresAt: DateTime!
    revokedAt: DateTime
    
    # Security
    isTwoFactorVerified: Boolean!
    riskScore: Float
    isSuspicious: Boolean!
    suspiciousReason: String
    
    # Meta
    revokedBy: Admin
    revokeReason: String
  }

  type RateLimitRule {
    id: ID!
    name: String!
    description: String
    
    # Scope
    scope: RateLimitScope!
    endpoint: String
    method: String
    
    # Limits
    maxRequests: Int!
    windowSeconds: Int!
    burstLimit: Int
    
    # Actions
    blockDuration: Int!
    penaltyMultiplier: Float
    
    # Targeting
    subscriptionTierOverrides: [TierRateLimitOverride!]
    exemptIPs: [String!]
    exemptUserIds: [ID!]
    
    # Status
    isActive: Boolean!
    
    # Stats
    totalViolations: Int!
    uniqueViolators: Int!
    
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TierRateLimitOverride {
    tier: SubscriptionTier!
    maxRequests: Int!
    windowSeconds: Int!
    burstLimit: Int
  }

  type RateLimitViolation {
    id: ID!
    rule: RateLimitRule!
    
    # Violator
    ipAddress: String!
    userId: ID
    user: User
    
    # Details
    endpoint: String!
    requestCount: Int!
    windowStart: DateTime!
    windowEnd: DateTime!
    
    # Action Taken
    actionTaken: String!
    blockExpiry: DateTime
    
    # Geolocation
    country: String
    city: String
    
    createdAt: DateTime!
  }

  type SecurityPolicy {
    id: ID!
    type: SecurityPolicyType!
    name: String!
    description: String
    
    # Configuration
    config: JSON!
    
    # Applicability
    appliesToAllUsers: Boolean!
    appliesToTiers: [SubscriptionTier!]
    appliesToRoles: [String!]
    
    # Status
    isActive: Boolean!
    isEnforced: Boolean!
    
    # Versioning
    version: Int!
    previousVersions: [PolicyVersion!]
    
    createdBy: Admin!
    lastModifiedBy: Admin
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PolicyVersion {
    version: Int!
    config: JSON!
    modifiedBy: Admin!
    modifiedAt: DateTime!
    changeNote: String
  }

  type PasswordPolicy {
    minLength: Int!
    maxLength: Int!
    requireUppercase: Boolean!
    requireLowercase: Boolean!
    requireNumbers: Boolean!
    requireSpecialChars: Boolean!
    preventCommonPasswords: Boolean!
    preventUserInfoInPassword: Boolean!
    passwordHistoryCount: Int!
    maxAge: Int
    minAge: Int
  }

  type LoginPolicy {
    maxLoginAttempts: Int!
    lockoutDuration: Int!
    lockoutThreshold: Int!
    requireCaptchaAfterFailures: Int!
    allowRememberMe: Boolean!
    rememberMeDuration: Int!
    requireTwoFactorForAdmins: Boolean!
    allowedLoginMethods: [String!]!
    geoRestrictions: [GeoRestriction!]
  }

  type GeoRestriction {
    type: String!
    countries: [String!]!
    action: String!
  }

  type SessionPolicy {
    maxConcurrentSessions: Int!
    sessionTimeout: Int!
    extendOnActivity: Boolean!
    requireReauthForSensitive: Boolean!
    reauthTimeout: Int!
    trustDeviceDuration: Int
  }

  type AuditLog {
    id: ID!
    action: AuditLogAction!
    category: String!
    
    # Actor
    userId: ID
    user: User
    adminId: ID
    admin: Admin
    ipAddress: String!
    userAgent: String
    
    # Target
    targetType: String
    targetId: ID
    targetDetails: String
    
    # Details
    description: String!
    metadata: JSON
    
    # Request
    requestPath: String
    requestMethod: String
    requestId: String
    
    # Response
    success: Boolean!
    errorMessage: String
    
    # Geolocation
    country: String
    city: String
    
    # Risk
    riskLevel: String
    flagged: Boolean!
    flagReason: String
    
    createdAt: DateTime!
  }

  type TwoFactorStats {
    totalEnabled: Int!
    enabledByMethod: [TwoFactorMethodStats!]!
    enrollmentRate: Float!
    
    # Trends
    dailyEnrollments: [DailyTwoFactorStats!]!
    
    # By Tier
    bySubscriptionTier: [TierTwoFactorStats!]!
    
    # Failures
    recentFailures: Int!
    failureRate: Float!
  }

  type TwoFactorMethodStats {
    method: TwoFactorMethod!
    count: Int!
    percentage: Float!
  }

  type DailyTwoFactorStats {
    date: DateTime!
    enrollments: Int!
    disenrollments: Int!
    authentications: Int!
    failures: Int!
  }

  type TierTwoFactorStats {
    tier: SubscriptionTier!
    totalUsers: Int!
    twoFactorEnabled: Int!
    percentage: Float!
  }

  type UserTwoFactorInfo {
    user: User!
    isEnabled: Boolean!
    methods: [TwoFactorMethod!]!
    primaryMethod: TwoFactorMethod
    backupCodesRemaining: Int
    lastUsed: DateTime
    enrolledAt: DateTime
  }

  type FirewallRule {
    id: ID!
    name: String!
    description: String
    
    # Rule Definition
    priority: Int!
    action: FirewallRuleAction!
    
    # Conditions
    conditions: FirewallConditions!
    
    # Status
    isActive: Boolean!
    
    # Stats
    matchCount: Int!
    lastMatch: DateTime
    
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FirewallConditions {
    ipAddresses: [String!]
    ipRanges: [String!]
    countries: [String!]
    userAgentPatterns: [String!]
    pathPatterns: [String!]
    queryPatterns: [String!]
    headerPatterns: [HeaderPattern!]
    requestBodyPatterns: [String!]
    methods: [String!]
    contentTypes: [String!]
  }

  type HeaderPattern {
    header: String!
    pattern: String!
    isRegex: Boolean!
  }

  type SecurityAnalytics {
    # Overview
    threatLevel: ThreatLevel!
    activeIncidents: Int!
    resolvedToday: Int!
    
    # Incidents
    incidentsByType: [IncidentTypeStats!]!
    incidentsBySeverity: [IncidentSeverityStats!]!
    incidentTrend: [DailyIncidentStats!]!
    
    # Authentication
    loginStats: LoginStats!
    failedLoginsByCountry: [CountryStats!]!
    
    # Sessions
    activeSessions: Int!
    suspiciousSessions: Int!
    sessionsPerDevice: [DeviceStats!]!
    
    # Rate Limiting
    rateLimitViolationsToday: Int!
    topViolators: [RateLimitViolatorStats!]!
    
    # Blocked IPs
    activeIPBlocks: Int!
    blockedRequestsToday: Int!
    
    # Two Factor
    twoFactorStats: TwoFactorStats!
    
    # Top Threats
    topThreatenedEndpoints: [EndpointThreatStats!]!
    topAttackingSources: [AttackSourceStats!]!
    
    # Firewall
    firewallBlocksToday: Int!
    firewallRuleMatches: [FirewallRuleMatchStats!]!
  }

  type IncidentTypeStats {
    type: SecurityIncidentType!
    count: Int!
    change: Float!
    severity: SecurityIncidentSeverity!
  }

  type IncidentSeverityStats {
    severity: SecurityIncidentSeverity!
    count: Int!
    percentage: Float!
  }

  type DailyIncidentStats {
    date: DateTime!
    total: Int!
    bySeverity: JSON!
  }

  type LoginStats {
    totalLogins: Int!
    successfulLogins: Int!
    failedLogins: Int!
    uniqueUsers: Int!
    suspiciousLogins: Int!
    blockedLogins: Int!
    twoFactorLogins: Int!
  }

  type CountryStats {
    country: String!
    countryCode: String!
    count: Int!
    percentage: Float!
  }

  type DeviceStats {
    deviceType: DeviceType!
    count: Int!
    percentage: Float!
  }

  type RateLimitViolatorStats {
    ipAddress: String
    userId: ID
    user: User
    violationCount: Int!
    lastViolation: DateTime!
    country: String
  }

  type EndpointThreatStats {
    endpoint: String!
    method: String!
    attackCount: Int!
    uniqueAttackers: Int!
    lastAttack: DateTime!
    topAttackTypes: [String!]!
  }

  type AttackSourceStats {
    ipAddress: String!
    country: String
    city: String
    attackCount: Int!
    attackTypes: [SecurityIncidentType!]!
    isBlocked: Boolean!
    riskScore: Float!
  }

  type FirewallRuleMatchStats {
    rule: FirewallRule!
    matchCount: Int!
    blockedCount: Int!
    challengedCount: Int!
  }

  type ComplianceReport {
    id: ID!
    type: String!
    period: String!
    status: ComplianceStatus!
    
    # Scores
    overallScore: Float!
    categoryScores: [ComplianceCategoryScore!]!
    
    # Findings
    totalFindings: Int!
    criticalFindings: Int!
    findings: [ComplianceFinding!]!
    
    # Recommendations
    recommendations: [ComplianceRecommendation!]!
    
    generatedAt: DateTime!
    generatedBy: Admin
    
    # Previous
    previousReport: ComplianceReport
    scoreChange: Float
  }

  type ComplianceCategoryScore {
    category: String!
    score: Float!
    maxScore: Float!
    status: ComplianceStatus!
  }

  type ComplianceFinding {
    id: ID!
    severity: String!
    category: String!
    title: String!
    description: String!
    recommendation: String!
    evidence: String
    remediated: Boolean!
    remediatedAt: DateTime
  }

  type ComplianceRecommendation {
    priority: Int!
    title: String!
    description: String!
    effort: String!
    impact: String!
  }

  type SecurityAlert {
    id: ID!
    type: SecurityAlertType!
    severity: SecurityIncidentSeverity!
    
    title: String!
    message: String!
    
    # Related
    relatedIncident: SecurityIncident
    relatedPolicy: SecurityPolicy
    
    # Status
    acknowledged: Boolean!
    acknowledgedBy: Admin
    acknowledgedAt: DateTime
    
    # Notification
    notifiedAdmins: [Admin!]!
    
    createdAt: DateTime!
  }

  type SecurityDashboard {
    # Current Status
    threatLevel: ThreatLevel!
    systemStatus: String!
    
    # Quick Stats
    activeIncidents: Int!
    unresolvedCritical: Int!
    blockedIPs: Int!
    activeSessions: Int!
    
    # Recent
    recentIncidents: [SecurityIncident!]!
    recentAlerts: [SecurityAlert!]!
    
    # Trends
    incidentTrend: [DailyIncidentStats!]!
    loginTrend: [DailyLoginStats!]!
    
    # Health
    systemHealth: SystemSecurityHealth!
    
    # Pending Actions
    pendingReviews: Int!
    pendingAlerts: Int!
  }

  type DailyLoginStats {
    date: DateTime!
    successful: Int!
    failed: Int!
    blocked: Int!
  }

  type SystemSecurityHealth {
    passwordPolicy: HealthStatus!
    twoFactorEnforcement: HealthStatus!
    sessionManagement: HealthStatus!
    rateLimiting: HealthStatus!
    firewall: HealthStatus!
    auditLogging: HealthStatus!
    encryptionStatus: HealthStatus!
    backupStatus: HealthStatus!
    certificateStatus: CertificateHealth!
  }

  type HealthStatus {
    status: String!
    message: String
    lastChecked: DateTime!
  }

  type CertificateHealth {
    status: String!
    expiresAt: DateTime
    daysUntilExpiry: Int
    issuer: String
  }

  type VulnerabilityScan {
    id: ID!
    type: String!
    status: String!
    
    # Results
    totalVulnerabilities: Int!
    criticalCount: Int!
    highCount: Int!
    mediumCount: Int!
    lowCount: Int!
    
    vulnerabilities: [Vulnerability!]!
    
    startedAt: DateTime!
    completedAt: DateTime
    
    initiatedBy: Admin!
  }

  type Vulnerability {
    id: ID!
    severity: String!
    title: String!
    description: String!
    affectedComponent: String!
    cveId: String
    cvssScore: Float
    recommendation: String!
    status: String!
    mitigatedAt: DateTime
  }

  # ============================================
  # INPUTS
  # ============================================

  input SecurityIncidentFilterInput {
    types: [SecurityIncidentType!]
    severities: [SecurityIncidentSeverity!]
    statuses: [SecurityIncidentStatus!]
    assignedTo: ID
    targetUserId: ID
    sourceIP: String
    sourceCountry: String
    dateFrom: DateTime
    dateTo: DateTime
    searchTerm: String
    tags: [String!]
  }

  input SecurityIncidentListInput {
    filter: SecurityIncidentFilterInput
    sortBy: SecuritySortField
    sortOrder: SortOrder
    page: Int
    limit: Int
  }

  input CreateSecurityIncidentInput {
    type: SecurityIncidentType!
    severity: SecurityIncidentSeverity!
    title: String!
    description: String!
    sourceIP: String
    targetUserId: ID
    targetEndpoint: String
    targetResource: String
    indicators: [ThreatIndicatorInput!]
    tags: [String!]
  }

  input ThreatIndicatorInput {
    type: String!
    value: String!
    confidence: Float!
    source: String
  }

  input UpdateSecurityIncidentInput {
    incidentId: ID!
    status: SecurityIncidentStatus
    severity: SecurityIncidentSeverity
    assignedTo: ID
    description: String
    tags: [String!]
  }

  input AddIncidentNoteInput {
    incidentId: ID!
    content: String!
    isPrivate: Boolean
  }

  input IncidentResponseActionInput {
    incidentId: ID!
    action: String!
    result: String
    automated: Boolean
  }

  input BlockIPInput {
    ipAddress: String!
    ipRange: String
    reason: IPBlockReason!
    description: String
    expiresAt: DateTime
    relatedIncidentId: ID
  }

  input WhitelistIPInput {
    ipAddress: String!
    ipRange: String
    description: String!
    associatedUserId: ID
    associatedService: String
    validUntil: DateTime
  }

  input RateLimitRuleInput {
    name: String!
    description: String
    scope: RateLimitScope!
    endpoint: String
    method: String
    maxRequests: Int!
    windowSeconds: Int!
    burstLimit: Int
    blockDuration: Int!
    penaltyMultiplier: Float
    subscriptionTierOverrides: [TierRateLimitOverrideInput!]
    exemptIPs: [String!]
    exemptUserIds: [ID!]
  }

  input TierRateLimitOverrideInput {
    tier: SubscriptionTier!
    maxRequests: Int!
    windowSeconds: Int!
    burstLimit: Int
  }

  input UpdateRateLimitRuleInput {
    ruleId: ID!
    name: String
    description: String
    maxRequests: Int
    windowSeconds: Int
    burstLimit: Int
    blockDuration: Int
    isActive: Boolean
    subscriptionTierOverrides: [TierRateLimitOverrideInput!]
    exemptIPs: [String!]
    exemptUserIds: [ID!]
  }

  input CreateSecurityPolicyInput {
    type: SecurityPolicyType!
    name: String!
    description: String
    config: JSON!
    appliesToAllUsers: Boolean
    appliesToTiers: [SubscriptionTier!]
    appliesToRoles: [String!]
    isEnforced: Boolean
  }

  input UpdateSecurityPolicyInput {
    policyId: ID!
    name: String
    description: String
    config: JSON
    appliesToAllUsers: Boolean
    appliesToTiers: [SubscriptionTier!]
    appliesToRoles: [String!]
    isActive: Boolean
    isEnforced: Boolean
    changeNote: String
  }

  input PasswordPolicyInput {
    minLength: Int!
    maxLength: Int
    requireUppercase: Boolean!
    requireLowercase: Boolean!
    requireNumbers: Boolean!
    requireSpecialChars: Boolean!
    preventCommonPasswords: Boolean
    preventUserInfoInPassword: Boolean
    passwordHistoryCount: Int
    maxAge: Int
    minAge: Int
  }

  input LoginPolicyInput {
    maxLoginAttempts: Int!
    lockoutDuration: Int!
    lockoutThreshold: Int
    requireCaptchaAfterFailures: Int
    allowRememberMe: Boolean
    rememberMeDuration: Int
    requireTwoFactorForAdmins: Boolean
    allowedLoginMethods: [String!]
    geoRestrictions: [GeoRestrictionInput!]
  }

  input GeoRestrictionInput {
    type: String!
    countries: [String!]!
    action: String!
  }

  input SessionPolicyInput {
    maxConcurrentSessions: Int!
    sessionTimeout: Int!
    extendOnActivity: Boolean
    requireReauthForSensitive: Boolean
    reauthTimeout: Int
    trustDeviceDuration: Int
  }

  input AuditLogFilterInput {
    actions: [AuditLogAction!]
    categories: [String!]
    userId: ID
    adminId: ID
    ipAddress: String
    targetType: String
    targetId: ID
    success: Boolean
    flagged: Boolean
    dateFrom: DateTime
    dateTo: DateTime
    searchTerm: String
  }

  input AuditLogListInput {
    filter: AuditLogFilterInput
    sortBy: String
    sortOrder: SortOrder
    page: Int
    limit: Int
  }

  input CreateFirewallRuleInput {
    name: String!
    description: String
    priority: Int!
    action: FirewallRuleAction!
    conditions: FirewallConditionsInput!
    isActive: Boolean
  }

  input FirewallConditionsInput {
    ipAddresses: [String!]
    ipRanges: [String!]
    countries: [String!]
    userAgentPatterns: [String!]
    pathPatterns: [String!]
    queryPatterns: [String!]
    headerPatterns: [HeaderPatternInput!]
    requestBodyPatterns: [String!]
    methods: [String!]
    contentTypes: [String!]
  }

  input HeaderPatternInput {
    header: String!
    pattern: String!
    isRegex: Boolean
  }

  input UpdateFirewallRuleInput {
    ruleId: ID!
    name: String
    description: String
    priority: Int
    action: FirewallRuleAction
    conditions: FirewallConditionsInput
    isActive: Boolean
  }

  input RevokeSessionInput {
    sessionId: ID!
    reason: String!
  }

  input BulkRevokeSessionsInput {
    userId: ID
    ipAddress: String
    deviceType: DeviceType
    reason: String!
    exceptCurrentSession: Boolean
  }

  input ResetUserTwoFactorInput {
    userId: ID!
    reason: String!
    notifyUser: Boolean
  }

  input SecurityAnalyticsInput {
    dateFrom: DateTime!
    dateTo: DateTime!
    includeDetails: Boolean
  }

  input ComplianceScanInput {
    type: String!
    scope: [String!]
  }

  input VulnerabilityScanInput {
    type: String!
    targetScope: [String!]
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    # Dashboard
    securityDashboard: SecurityDashboard! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Incidents
    securityIncidents(input: SecurityIncidentListInput!): PaginatedSecurityIncidents! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    securityIncident(id: ID!): SecurityIncident @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    activeSecurityThreats: [SecurityIncident!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # IP Management
    blockedIPs(status: IPBlockStatus, page: Int, limit: Int): PaginatedIPBlocks! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    whitelistedIPs: [IPWhitelist!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    checkIPStatus(ipAddress: String!): IPStatus! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Sessions
    activeSessions(userId: ID, page: Int, limit: Int): PaginatedSessions! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    suspiciousSessions: [UserSession!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    userSessionHistory(userId: ID!, limit: Int): [UserSession!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Rate Limiting
    rateLimitRules: [RateLimitRule!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    rateLimitRule(id: ID!): RateLimitRule @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    rateLimitViolations(ruleId: ID, page: Int, limit: Int): PaginatedRateLimitViolations! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Policies
    securityPolicies(type: SecurityPolicyType): [SecurityPolicy!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    securityPolicy(id: ID!): SecurityPolicy @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    passwordPolicy: PasswordPolicy! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    loginPolicy: LoginPolicy! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    sessionPolicy: SessionPolicy! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Audit Logs
    auditLogs(input: AuditLogListInput!): PaginatedAuditLogs! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    auditLog(id: ID!): AuditLog @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    userAuditTrail(userId: ID!, limit: Int): [AuditLog!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Two Factor
    twoFactorStats: TwoFactorStats! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    userTwoFactorInfo(userId: ID!): UserTwoFactorInfo @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    twoFactorEnrollmentList(enabled: Boolean, method: TwoFactorMethod, page: Int, limit: Int): [UserTwoFactorInfo!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Firewall
    firewallRules: [FirewallRule!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    firewallRule(id: ID!): FirewallRule @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Analytics
    securityAnalytics(input: SecurityAnalyticsInput!): SecurityAnalytics! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    threatAnalysis(dateFrom: DateTime!, dateTo: DateTime!): ThreatAnalysis! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Compliance
    complianceReports(limit: Int): [ComplianceReport!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    latestComplianceReport: ComplianceReport @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Alerts
    securityAlerts(acknowledged: Boolean, limit: Int): [SecurityAlert!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Vulnerabilities
    vulnerabilityScans(limit: Int): [VulnerabilityScan!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    latestVulnerabilityScan: VulnerabilityScan @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Health
    systemSecurityHealth: SystemSecurityHealth! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
  }

  type PaginatedSecurityIncidents {
    incidents: [SecurityIncident!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  type PaginatedIPBlocks {
    blocks: [IPBlock!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  type PaginatedSessions {
    sessions: [UserSession!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  type PaginatedRateLimitViolations {
    violations: [RateLimitViolation!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  type PaginatedAuditLogs {
    logs: [AuditLog!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  type IPStatus {
    ipAddress: String!
    isBlocked: Boolean!
    isWhitelisted: Boolean!
    blockInfo: IPBlock
    whitelistInfo: IPWhitelist
    recentActivity: [AuditLog!]!
    riskScore: Float!
  }

  type ThreatAnalysis {
    period: String!
    totalThreats: Int!
    blockedThreats: Int!
    topThreatTypes: [ThreatTypeAnalysis!]!
    topAttackVectors: [AttackVectorAnalysis!]!
    geographicDistribution: [CountryStats!]!
    temporalAnalysis: [HourlyThreatStats!]!
    recommendations: [String!]!
  }

  type ThreatTypeAnalysis {
    type: SecurityIncidentType!
    count: Int!
    trend: String!
    mitigationRate: Float!
  }

  type AttackVectorAnalysis {
    vector: String!
    count: Int!
    successRate: Float!
    primaryTargets: [String!]!
  }

  type HourlyThreatStats {
    hour: Int!
    threats: Int!
    blocked: Int!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    # Incidents
    createSecurityIncident(input: CreateSecurityIncidentInput!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    updateSecurityIncident(input: UpdateSecurityIncidentInput!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    assignSecurityIncident(incidentId: ID!, adminId: ID!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    escalateSecurityIncident(incidentId: ID!, adminId: ID!, reason: String!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    resolveSecurityIncident(incidentId: ID!, resolution: String!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    addIncidentNote(input: AddIncidentNoteInput!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    recordIncidentAction(input: IncidentResponseActionInput!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    mergeIncidents(primaryId: ID!, secondaryIds: [ID!]!): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # IP Management
    blockIP(input: BlockIPInput!): IPBlock! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    unblockIP(ipAddress: String!, reason: String!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    extendIPBlock(blockId: ID!, newExpiry: DateTime!): IPBlock! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    whitelistIP(input: WhitelistIPInput!): IPWhitelist! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    removeIPFromWhitelist(ipAddress: String!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    bulkBlockIPs(ips: [BlockIPInput!]!): Int! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Sessions
    revokeSession(input: RevokeSessionInput!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    bulkRevokeSessions(input: BulkRevokeSessionsInput!): Int! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    revokeAllUserSessions(userId: ID!, reason: String!): Int! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    forcePasswordReset(userId: ID!, reason: String!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    unlockUserAccount(userId: ID!, reason: String!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Rate Limiting
    createRateLimitRule(input: RateLimitRuleInput!): RateLimitRule! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    updateRateLimitRule(input: UpdateRateLimitRuleInput!): RateLimitRule! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    deleteRateLimitRule(ruleId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    toggleRateLimitRule(ruleId: ID!, isActive: Boolean!): RateLimitRule! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    clearRateLimitViolations(ruleId: ID): Int! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Policies
    createSecurityPolicy(input: CreateSecurityPolicyInput!): SecurityPolicy! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    updateSecurityPolicy(input: UpdateSecurityPolicyInput!): SecurityPolicy! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    deleteSecurityPolicy(policyId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    toggleSecurityPolicy(policyId: ID!, isActive: Boolean!): SecurityPolicy! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    enforceSecurityPolicy(policyId: ID!, enforce: Boolean!): SecurityPolicy! @auth(requires: [SUPER_ADMIN])
    updatePasswordPolicy(input: PasswordPolicyInput!): PasswordPolicy! @auth(requires: [SUPER_ADMIN])
    updateLoginPolicy(input: LoginPolicyInput!): LoginPolicy! @auth(requires: [SUPER_ADMIN])
    updateSessionPolicy(input: SessionPolicyInput!): SessionPolicy! @auth(requires: [SUPER_ADMIN])
    
    # Two Factor
    resetUserTwoFactor(input: ResetUserTwoFactorInput!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    enforceTwoFactor(userId: ID!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    generateUserBackupCodes(userId: ID!): [String!]! @auth(requires: [SUPER_ADMIN])
    
    # Firewall
    createFirewallRule(input: CreateFirewallRuleInput!): FirewallRule! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    updateFirewallRule(input: UpdateFirewallRuleInput!): FirewallRule! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    deleteFirewallRule(ruleId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    toggleFirewallRule(ruleId: ID!, isActive: Boolean!): FirewallRule! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    reorderFirewallRules(ruleIds: [ID!]!): [FirewallRule!]! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Alerts
    acknowledgeSecurityAlert(alertId: ID!): SecurityAlert! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    dismissSecurityAlert(alertId: ID!, reason: String!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Compliance & Scanning
    runComplianceScan(input: ComplianceScanInput!): ComplianceReport! @auth(requires: [SUPER_ADMIN])
    runVulnerabilityScan(input: VulnerabilityScanInput!): VulnerabilityScan! @auth(requires: [SUPER_ADMIN])
    markVulnerabilityMitigated(vulnerabilityId: ID!, note: String!): Boolean! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Emergency Actions
    enableEmergencyMode(reason: String!): Boolean! @auth(requires: [SUPER_ADMIN])
    disableEmergencyMode: Boolean! @auth(requires: [SUPER_ADMIN])
    lockdownEndpoint(endpoint: String!, duration: Int!, reason: String!): Boolean! @auth(requires: [SUPER_ADMIN])
    unlockEndpoint(endpoint: String!): Boolean! @auth(requires: [SUPER_ADMIN])
    
    # Audit
    flagAuditLog(logId: ID!, reason: String!): AuditLog! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    exportAuditLogs(filter: AuditLogFilterInput!, format: String!): String! @auth(requires: [SUPER_ADMIN])
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  extend type Subscription {
    # Real-time Monitoring
    newSecurityIncident: SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    securityIncidentUpdate(incidentId: ID): SecurityIncident! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Alerts
    newSecurityAlert: SecurityAlert! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    threatLevelChange: ThreatLevel! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Live Stats
    liveSecurityStats: SecurityAnalytics! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    suspiciousActivity: SuspiciousActivityAlert! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Sessions
    sessionAnomaly: UserSession! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
    
    # Rate Limiting
    rateLimitBreach(ruleId: ID): RateLimitViolation! @auth(requires: [SECURITY_ADMIN, SUPER_ADMIN])
  }

  type SuspiciousActivityAlert {
    type: String!
    severity: SecurityIncidentSeverity!
    details: JSON!
    sourceIP: String
    userId: ID
    timestamp: DateTime!
  }
`;

export default securityManagementTypeDef;