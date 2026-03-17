import { describe, it, expect } from 'vitest';
import { QK } from '@/lib/queryKeys';

describe('QK query key factory', () => {
  describe('Dashboard keys', () => {
    it('complianceStats returns stable key', () => {
      expect(QK.complianceStats()).toEqual(['compliance', 'stats']);
    });

    it('riskOverview returns stable key', () => {
      expect(QK.riskOverview()).toEqual(['risks', 'overview']);
    });

    it('activityLog includes limit param', () => {
      expect(QK.activityLog(10)).toEqual(['activity', 'recent', 10]);
      expect(QK.activityLog()).toEqual(['activity', 'recent', undefined]);
    });
  });

  describe('Controls keys', () => {
    it('controls without filter', () => {
      expect(QK.controls()).toEqual(['controls', 'list', undefined]);
    });

    it('controls with filter includes filter object', () => {
      const filter = { status: 'active' };
      expect(QK.controls(filter)).toEqual(['controls', 'list', filter]);
    });
  });

  describe('Risk keys', () => {
    it('risks returns stable list key', () => {
      expect(QK.risks()).toEqual(['risks', 'list']);
    });

    it('riskDetail includes id', () => {
      expect(QK.riskDetail('risk-123')).toEqual(['risks', 'detail', 'risk-123']);
    });

    it('riskCenterOverview has distinct key from riskOverview', () => {
      expect(QK.riskCenterOverview()).not.toEqual(QK.riskOverview());
    });

    it('all risk keys are unique', () => {
      const keys = [
        JSON.stringify(QK.risks()),
        JSON.stringify(QK.riskCenterOverview()),
        JSON.stringify(QK.riskActions()),
        JSON.stringify(QK.riskSnapshot()),
        JSON.stringify(QK.riskLibrary()),
        JSON.stringify(QK.riskSettings()),
      ];
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    });
  });

  describe('Test keys', () => {
    it('testDetail includes id', () => {
      expect(QK.testDetail('test-456')).toEqual(['tests', 'detail', 'test-456']);
    });

    it('testHistory includes id', () => {
      expect(QK.testHistory('test-789')).toEqual(['tests', 'history', 'test-789']);
    });

    it('testRuns includes id', () => {
      expect(QK.testRuns('test-abc')).toEqual(['tests', 'runs', 'test-abc']);
    });
  });

  describe('Notification keys', () => {
    it('notificationsRoot returns base key', () => {
      expect(QK.notificationsRoot()).toEqual(['notifications']);
    });

    it('notificationsUnreadCount is nested under notifications', () => {
      const root = QK.notificationsRoot();
      const unread = QK.notificationsUnreadCount();
      expect(unread[0]).toBe(root[0]);
    });

    it('notificationsInbox includes filter', () => {
      const filter = { unread: true };
      expect(QK.notificationsInbox(filter)).toEqual(['notifications', 'inbox', filter]);
    });
  });

  describe('Partner keys', () => {
    it('partnerKeys returns stable key', () => {
      expect(QK.partnerKeys()).toEqual(['partner', 'keys']);
    });

    it('partnerResults includes filter', () => {
      const filter = { page: 1 };
      expect(QK.partnerResults(filter)).toEqual(['partner', 'results', filter]);
    });
  });

  describe('Prefix-based invalidation compatibility', () => {
    it('different entity types start with different prefixes', () => {
      expect(QK.risks()[0]).not.toBe(QK.controls({})[0]);
      expect(QK.tests({})[0]).not.toBe(QK.policies({})[0]);
    });

    it('testDetail shares prefix with testSummary for prefix invalidation', () => {
      expect(QK.testDetail('x')[0]).toBe(QK.testSummary()[0]);
    });
  });

  describe('MDM keys', () => {
    it('mdmDevices returns stable key', () => {
      expect(QK.mdmDevices()).toEqual(['mdm', 'devices']);
    });

    it('mdmTokens returns stable key', () => {
      expect(QK.mdmTokens()).toEqual(['mdm', 'tokens']);
    });
  });

  describe('Users keys', () => {
    it('users returns stable list key', () => {
      expect(QK.users()).toEqual(['users', 'list']);
    });
  });

  describe('Access keys', () => {
    it('accessRequests includes filter', () => {
      expect(QK.accessRequests({ status: 'pending' })).toEqual(['access', 'requests', { status: 'pending' }]);
    });

    it('auditLog includes filter', () => {
      expect(QK.auditLog({ userId: 'u1' })).toEqual(['access', 'audit-log', { userId: 'u1' }]);
    });
  });

  describe('Onboarding keys', () => {
    it('onboardingMe returns stable key', () => {
      expect(QK.onboardingMe()).toEqual(['onboarding', 'me']);
    });

    it('onboardingUsers returns stable key', () => {
      expect(QK.onboardingUsers()).toEqual(['onboarding', 'users']);
    });
  });

  describe('Policies keys', () => {
    it('policies without filter returns undefined filter', () => {
      expect(QK.policies()).toEqual(['policies', 'list', undefined]);
    });
  });

  describe('Partner catalogue', () => {
    it('partnerCatalogue returns stable key', () => {
      expect(QK.partnerCatalogue()).toEqual(['partner', 'catalogue']);
    });

    it('toolRequests includes filter', () => {
      expect(QK.toolRequests({ page: 2 })).toEqual(['partner', 'tool-requests', { page: 2 }]);
    });
  });
});
