import { AuthContext, AuthResult, Policy, Role, Relationship, AuthorizationError, AuthErrorCodes } from './types';
import { logger } from '../utils/logger';
import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

export class AuthorizationService {
  private static instance: AuthorizationService;
  private cache: Redis;
  private cacheTTL: number = 300; // 5 minutes

  private constructor(redisUrl: string) {
    this.cache = new Redis(redisUrl);
  }

  static getInstance(redisUrl: string): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService(redisUrl);
    }
    return AuthorizationService.instance;
  }

  async evaluate(context: AuthContext): Promise<AuthResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(context);

    try {
      // Check cache first
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            cacheHit: true,
            evaluationTime: performance.now() - startTime,
          },
        };
      }

      // Evaluate all authorization models
      const [rbacResult, pbacResult, rebacResult] = await Promise.all([
        this.evaluateRBAC(context),
        this.evaluatePBAC(context),
        this.evaluateReBAC(context),
      ]);

      // Combine results (all must allow)
      const allowed = rbacResult.allowed && pbacResult.allowed && rebacResult.allowed;
      const result: AuthResult = {
        allowed,
        reason: this.getDenialReason(rbacResult, pbacResult, rebacResult),
        policies: pbacResult.policies,
        roles: rbacResult.roles,
        relationships: rebacResult.relationships,
        metadata: {
          evaluatedAt: new Date(),
          evaluationTime: performance.now() - startTime,
          cacheHit: false,
        },
      };

      // Cache the result
      await this.cacheResult(cacheKey, result);

      return result;
    } catch (error) {
      logger.error('Authorization evaluation failed:', error);
      throw new AuthorizationError(
        AuthErrorCodes.INVALID_CONTEXT,
        'Failed to evaluate authorization',
        context
      );
    }
  }

  private async evaluateRBAC(context: AuthContext): Promise<AuthResult> {
    const { subject, action, resource } = context;
    
    // Get roles from database/cache
    const roles = await this.getRoles(subject.roles);
    
    // Check if any role has the required permission
    const hasPermission = roles.some(role => 
      role.permissions.includes(action) || 
      role.permissions.includes(`${resource.type}:${action}`)
    );

    return {
      allowed: hasPermission,
      roles,
      metadata: {
        evaluatedAt: new Date(),
        evaluationTime: 0,
        cacheHit: false,
      },
    };
  }

  private async evaluatePBAC(context: AuthContext): Promise<AuthResult> {
    const { subject, action, resource, environment } = context;
    
    // Get applicable policies
    const policies = await this.getPolicies(subject, resource);
    
    // Sort policies by priority
    policies.sort((a, b) => b.priority - a.priority);

    // Evaluate each policy
    for (const policy of policies) {
      const matches = this.evaluatePolicy(policy, context);
      if (matches) {
        return {
          allowed: policy.effect === 'allow',
          policies: [policy],
          metadata: {
            evaluatedAt: new Date(),
            evaluationTime: 0,
            cacheHit: false,
          },
        };
      }
    }

    // Default deny
    return {
      allowed: false,
      policies,
      metadata: {
        evaluatedAt: new Date(),
        evaluationTime: 0,
        cacheHit: false,
      },
    };
  }

  private async evaluateReBAC(context: AuthContext): Promise<AuthResult> {
    const { subject, resource } = context;
    
    // Get relationships
    const relationships = await this.getRelationships(subject, resource);
    
    // Check if any relationship grants access
    const hasAccess = relationships.some(rel => 
      this.isValidRelationship(rel, context)
    );

    return {
      allowed: hasAccess,
      relationships,
      metadata: {
        evaluatedAt: new Date(),
        evaluationTime: 0,
        cacheHit: false,
      },
    };
  }

  private evaluatePolicy(policy: Policy, context: AuthContext): boolean {
    // Check if action and resource match
    if (!policy.actions.includes(context.action) || 
        !policy.resources.includes(context.resource.type)) {
      return false;
    }

    // Evaluate all conditions
    return policy.conditions.every(condition => 
      this.evaluateCondition(condition, context)
    );
  }

  private evaluateCondition(condition: PolicyCondition, context: AuthContext): boolean {
    const { attribute, operator, value } = condition;
    const subjectValue = this.getAttributeValue(attribute, context);

    switch (operator) {
      case 'equals':
        return subjectValue === value;
      case 'contains':
        return String(subjectValue).includes(String(value));
      case 'startsWith':
        return String(subjectValue).startsWith(String(value));
      case 'endsWith':
        return String(subjectValue).endsWith(String(value));
      case 'matches':
        return new RegExp(String(value)).test(String(subjectValue));
      case 'in':
        return Array.isArray(value) && value.includes(subjectValue);
      case 'gt':
        return subjectValue > value;
      case 'lt':
        return subjectValue < value;
      case 'gte':
        return subjectValue >= value;
      case 'lte':
        return subjectValue <= value;
      default:
        return false;
    }
  }

  private getAttributeValue(attribute: string, context: AuthContext): unknown {
    // Support nested attributes with dot notation
    const parts = attribute.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }

    return value;
  }

  private isValidRelationship(relationship: Relationship, context: AuthContext): boolean {
    const { subject, resource } = context;
    
    // Check if relationship connects subject and resource
    return (
      (relationship.sourceType === subject.type && 
       relationship.sourceId === subject.id &&
       relationship.targetType === resource.type &&
       relationship.targetId === resource.id) ||
      (relationship.sourceType === resource.type &&
       relationship.sourceId === resource.id &&
       relationship.targetType === subject.type &&
       relationship.targetId === subject.id)
    );
  }

  private generateCacheKey(context: AuthContext): string {
    const { subject, action, resource } = context;
    return `auth:${subject.id}:${action}:${resource.type}:${resource.id}`;
  }

  private async getCachedResult(key: string): Promise<AuthResult | null> {
    const cached = await this.cache.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheResult(key: string, result: AuthResult): Promise<void> {
    await this.cache.setex(key, this.cacheTTL, JSON.stringify(result));
  }

  private getDenialReason(rbac: AuthResult, pbac: AuthResult, rebac: AuthResult): string | undefined {
    if (!rbac.allowed) return 'Insufficient role permissions';
    if (!pbac.allowed) return 'Policy violation';
    if (!rebac.allowed) return 'No valid relationship found';
    return undefined;
  }

  // These methods would typically interact with your database
  private async getRoles(roleIds: string[]): Promise<Role[]> {
    // Implement role fetching from database
    return [];
  }

  private async getPolicies(subject: Subject, resource: Resource): Promise<Policy[]> {
    // Implement policy fetching from database
    return [];
  }

  private async getRelationships(subject: Subject, resource: Resource): Promise<Relationship[]> {
    // Implement relationship fetching from database
    return [];
  }
} 