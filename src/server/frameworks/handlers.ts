import type { AuthUser } from '@/server/middleware/authenticate';
import { frameworkContracts } from './contracts';
import { FrameworkService } from './service';

type MaybePromise<T> = T | Promise<T>;

export interface FrameworkHandlerDeps {
  service?: FrameworkService;
}

function ok<T>(data: T) {
  return { success: true as const, data };
}

/** Shape passed in by the RouteRegistrar handler adapter in app.ts */
interface HandlerRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: unknown;
  user?: AuthUser;
}

export function createFrameworkHandlers(deps: FrameworkHandlerDeps = {}) {
  function getService(request?: HandlerRequest): FrameworkService {
    if (deps.service) return deps.service;
    // The service is injected at call-time via the module's runtime getter.
    // This path should never be hit — module.ts always provides a service.
    throw new Error('FrameworkService not provided to handler');
  }

  return {
    /** GET /api/frameworks */
    async listCatalog(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const data = await service.listCatalog();
      return frameworkContracts.listCatalog.response.parse(ok(data));
    },

    /** GET /api/frameworks/:slug */
    async getFramework(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const slug = request?.params?.slug ?? '';
      const data = await service.getFrameworkBySlug(slug);
      if (!data) {
        throw Object.assign(new Error(`Framework not found: ${slug}`), { statusCode: 404 });
      }
      return frameworkContracts.getFramework.response.parse(ok(data));
    },

    /** GET /api/frameworks/:slug/requirements */
    async listRequirements(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const slug = request?.params?.slug ?? '';
      const data = await service.listRequirements(slug);
      return frameworkContracts.listRequirements.response.parse(ok(data));
    },

    /** GET /api/org/frameworks */
    async listOrgFrameworks(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const organizationId = request?.user?.organizationId ?? '';
      const data = await service.listOrgFrameworks(organizationId);
      return frameworkContracts.listOrgFrameworks.response.parse(ok(data));
    },

    /** POST /api/org/frameworks */
    async activateFramework(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const body = frameworkContracts.activateFramework.body.parse(request?.body ?? {});
      const user = request?.user;
      if (!user?.organizationId) {
        throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
      }
      const data = await service.activateFramework({
        organizationId: user.organizationId,
        frameworkSlug: body.frameworkSlug,
        activatedBy: user.id,
        scopeNote: body.scopeNote,
      });
      return frameworkContracts.activateFramework.response.parse(ok(data));
    },

    /** PATCH /api/org/frameworks/:frameworkSlug/remove */
    async removeFramework(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const body = frameworkContracts.removeFramework.body.parse(request?.body ?? {});
      const user = request?.user;
      if (!user?.organizationId) {
        throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
      }
      const frameworkSlug = request?.params?.frameworkSlug ?? '';
      const data = await service.removeFramework({
        organizationId: user.organizationId,
        frameworkSlug,
        removedBy: user.id,
        reason: body.reason,
      });
      return frameworkContracts.removeFramework.response.parse(ok(data));
    },

    /** GET /api/org/frameworks/:frameworkSlug/entitlement */
    async checkEntitlement(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const user = request?.user;
      if (!user?.organizationId) {
        throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
      }
      const frameworkSlug = request?.params?.frameworkSlug ?? '';
      const data = await service.checkEntitlement(user.organizationId, frameworkSlug);
      return frameworkContracts.checkEntitlement.response.parse(ok(data));
    },

    /** GET /api/org/frameworks/:frameworkSlug/requirements */
    async listOrgRequirements(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const user = request?.user;
      if (!user?.organizationId) {
        throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
      }
      const frameworkSlug = request?.params?.frameworkSlug ?? '';
      const data = await service.listOrgRequirements(user.organizationId, frameworkSlug);
      return frameworkContracts.listOrgRequirements.response.parse(ok(data));
    },

    /** GET /api/org/frameworks/:frameworkSlug/coverage */
    async getCoverage(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const user = request?.user;
      if (!user?.organizationId) {
        throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
      }
      const frameworkSlug = request?.params?.frameworkSlug ?? '';
      const data = await service.getCoverage(user.organizationId, frameworkSlug);
      return frameworkContracts.getCoverage.response.parse(ok(data));
    },

    /** PATCH /api/org/requirements/:requirementId/owner */
    async updateRequirementOwner(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const user = request?.user;
      if (!user?.organizationId) {
        throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
      }
      const body = frameworkContracts.updateRequirementOwner.body.parse(request?.body ?? {});
      const requirementId = request?.params?.requirementId ?? '';
      const data = await service.updateRequirementOwner({
        requirementId,
        organizationId: user.organizationId,
        ownerId: body.ownerId,
        dueDate: body.dueDate,
      });
      return frameworkContracts.updateRequirementOwner.response.parse(ok(data));
    },

    /** PATCH /api/org/requirements/:requirementId/applicability */
    async updateApplicability(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const user = request?.user;
      if (!user?.organizationId) {
        throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
      }
      const body = frameworkContracts.updateApplicability.body.parse(request?.body ?? {});
      const requirementId = request?.params?.requirementId ?? '';
      const data = await service.updateApplicability({
        requirementId,
        organizationId: user.organizationId,
        applicabilityStatus: body.applicabilityStatus,
        justification: body.justification,
      });
      return frameworkContracts.updateApplicability.response.parse(ok(data));
    },

    /** POST /api/billing/entitlements/sync (SUPER_ADMIN only) */
    async syncEntitlement(request?: HandlerRequest) {
      const service = deps.service ?? getService(request);
      const user = request?.user;
      if (!user?.role || !['SUPER_ADMIN'].includes(user.role)) {
        throw Object.assign(new Error('Insufficient permissions — SUPER_ADMIN required'), { statusCode: 403 });
      }
      const body = frameworkContracts.syncEntitlement.body.parse(request?.body ?? {});
      await service.syncEntitlement(body);
      return frameworkContracts.syncEntitlement.response.parse(ok({ synced: true as const }));
    },
  } satisfies Record<string, (...args: any[]) => MaybePromise<unknown>>;
}

export type FrameworkHandlers = ReturnType<typeof createFrameworkHandlers>;
