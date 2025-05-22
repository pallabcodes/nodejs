import { z } from 'zod';

// Base types for all authorization models
export type Resource = {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
  };
};

export type Subject = {
  id: string;
  type: 'user' | 'service' | 'system';
  attributes: Record<string, unknown>;
  roles: string[];
  permissions: string[];
  metadata: {
    tenantId?: string;
    lastActive: Date;
  };
};

// RBAC Types
export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  metadata: z.object({
    tenantId: z.string().uuid().optional(),
    isSystem: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type Role = z.infer<typeof RoleSchema>;

// PBAC Types
export type Policy = {
  id: string;
  name: string;
  description?: string;
  effect: 'allow' | 'deny';
  conditions: PolicyCondition[];
  actions: string[];
  resources: string[];
  priority: number;
  metadata: {
    tenantId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

export interface PolicyCondition {
  attribute: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'in' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
}

// ReBAC Types
export type Relationship = {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relation: string;
  attributes: Record<string, unknown>;
  metadata: {
    tenantId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

// Authorization Context
export type AuthContext = {
  subject: Subject;
  action: string;
  resource: Resource;
  environment: {
    ip: string;
    userAgent?: string;
    timestamp: Date;
    location?: {
      country: string;
      city: string;
    };
    device?: {
      type: string;
      os: string;
      browser: string;
    };
  };
  session?: {
    id: string;
    token: string;
    expiresAt: Date;
  };
};

// Authorization Result
export type AuthResult = {
  allowed: boolean;
  reason?: string;
  policies?: Policy[];
  roles?: Role[];
  relationships?: Relationship[];
  metadata: {
    evaluatedAt: Date;
    evaluationTime: number;
    cacheHit: boolean;
  };
};

// Common Authorization Errors
export class AuthorizationError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Partial<AuthContext>
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export const AuthErrorCodes = {
  INSUFFICIENT_PERMISSIONS: 'AUTH_001',
  INVALID_ROLE: 'AUTH_002',
  POLICY_VIOLATION: 'AUTH_003',
  RELATIONSHIP_NOT_FOUND: 'AUTH_004',
  INVALID_CONTEXT: 'AUTH_005',
  RATE_LIMITED: 'AUTH_006',
  SESSION_EXPIRED: 'AUTH_007',
  INVALID_TENANT: 'AUTH_008',
} as const;