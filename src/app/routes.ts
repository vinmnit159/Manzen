import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "@/app/components/Layout";
import { HomePage } from "@/app/pages/HomePage";
import { MyWorkPage } from "@/app/pages/MyWorkPage";
import { TestsPage } from "@/app/pages/TestsPage";
import { ReportsPage } from "@/app/pages/ReportsPage";
import { ReportViewerPage } from "@/app/pages/reports/ReportViewerPage";
import { AuditorDashboardPage } from "@/app/pages/auditor/AuditorDashboardPage";
import { AuditFinalReportPage } from "@/app/pages/auditor/AuditFinalReportPage";
import { PublicTrustPortalPage } from "@/app/pages/trust/PublicTrustPortalPage";

// Auth
import { LoginPage } from "@/app/pages/auth/LoginPage";
import { RegisterPage } from "@/app/pages/auth/RegisterPage";
import { AuthCallbackPage } from "@/app/pages/auth/AuthCallbackPage";

// Compliance
import { FrameworksPage } from "@/app/pages/compliance/FrameworksPage";
import { ControlsPage } from "@/app/pages/controls/ControlsPage";
import { PoliciesPage } from "@/app/pages/compliance/PoliciesPage";
import { DocumentsPage } from "@/app/pages/compliance/DocumentsPage";
import { AuditsPage } from "@/app/pages/compliance/AuditsPage";
import { FindingsPage } from "@/app/pages/compliance/FindingsPage";
import { ComplianceSettingsPage } from "@/app/pages/compliance/SettingsPage";

// Customer Trust
import { CustomerTrustOverviewPage } from "@/app/pages/customer-trust/OverviewPage";
import { AccountsPage } from "@/app/pages/customer-trust/AccountsPage";
import { TrustCenterPage } from "@/app/pages/customer-trust/TrustCenterPage";
import { CommitmentsPage } from "@/app/pages/customer-trust/CommitmentsPage";
import { KnowledgeBasePage } from "@/app/pages/customer-trust/KnowledgeBasePage";
import { ActivityPage } from "@/app/pages/customer-trust/ActivityPage";
import { CustomerTrustSettingsPage } from "@/app/pages/customer-trust/SettingsPage";

// Risk
import { RiskOverviewPage } from "@/app/pages/risk/OverviewPage";
import { RisksPage } from "@/app/pages/risk/RisksPage";
import { RiskLibraryPage } from "@/app/pages/risk/RiskLibraryPage";
import { ActionTrackerPage } from "@/app/pages/risk/ActionTrackerPage";
import { SnapshotPage } from "@/app/pages/risk/SnapshotPage";
import { RiskSettingsPage } from "@/app/pages/risk/SettingsPage";

// Vendors
import { VendorsPage } from "@/app/pages/vendors/VendorsPage";

// Privacy
import { DataInventoryPage } from "@/app/pages/privacy/DataInventoryPage";
import { PrivacySettingsPage } from "@/app/pages/privacy/SettingsPage";

// Assets
import { InventoryPage } from "@/app/pages/assets/InventoryPage";
import { CodeChangesPage } from "@/app/pages/assets/CodeChangesPage";
import { VulnerabilitiesPage } from "@/app/pages/assets/VulnerabilitiesPage";
import { SecurityAlertsPage } from "@/app/pages/assets/SecurityAlertsPage";
import { AssetsSettingsPage } from "@/app/pages/assets/SettingsPage";

// Personnel
import { PeoplePage } from "@/app/pages/personnel/PeoplePage";
import { ComputersPage } from "@/app/pages/personnel/ComputersPage";
import { AccessPage } from "@/app/pages/personnel/AccessPage";
import { PersonnelSettingsPage } from "@/app/pages/personnel/SettingsPage";

// Other
import { IntegrationsPage } from "@/app/pages/IntegrationsPage";
import { MySecurityTasksPage } from "@/app/pages/MySecurityTasksPage";
import { MyAccessRequestsPage } from "@/app/pages/MyAccessRequestsPage";

// Account
import { AccountSettingsPage } from "@/app/pages/account/AccountSettingsPage";

// Auth guard: redirect to /login if no token
function requireAuth() {
  const token = localStorage.getItem("isms_token");
  if (!token) {
    return redirect("/login");
  }
  return null;
}

export const router = createBrowserRouter([
  // Public auth routes (no layout)
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    // OAuth callback — stores JWT then redirects to "/"
    path: "/auth/callback",
    Component: AuthCallbackPage,
  },

  // Public Trust Center portal (no auth, no app layout)
  {
    path: "/trust/:orgSlug",
    Component: PublicTrustPortalPage,
  },

  // Protected app routes (with layout)
  {
    path: "/",
    Component: Layout,
    loader: requireAuth,
    children: [
      { index: true, Component: HomePage },
      { path: "my-work", Component: MyWorkPage },
      { path: "tests", Component: TestsPage },
      { path: "reports", Component: ReportsPage },
      { path: "reports/viewer/:reportId", Component: ReportViewerPage },

      // Auditor role
      { path: "auditor/dashboard", Component: AuditorDashboardPage },
      { path: "auditor/audits/:auditId/final-report", Component: AuditFinalReportPage },

      // Compliance routes
      { path: "compliance/frameworks", Component: FrameworksPage },
      { path: "compliance/controls", Component: ControlsPage },
      { path: "compliance/policies", Component: PoliciesPage },
      { path: "compliance/documents", Component: DocumentsPage },
      { path: "compliance/audits",   Component: AuditsPage },
      { path: "compliance/findings", Component: FindingsPage },
      { path: "compliance/settings", Component: ComplianceSettingsPage },

      // Customer Trust routes
      { path: "customer-trust/overview", Component: CustomerTrustOverviewPage },
      { path: "customer-trust/accounts", Component: AccountsPage },
      { path: "customer-trust/trust-center", Component: TrustCenterPage },
      { path: "customer-trust/commitments", Component: CommitmentsPage },
      { path: "customer-trust/knowledge-base", Component: KnowledgeBasePage },
      { path: "customer-trust/activity", Component: ActivityPage },
      { path: "customer-trust/settings", Component: CustomerTrustSettingsPage },

      // Risk routes
      { path: "risk/overview", Component: RiskOverviewPage },
      { path: "risk/risks", Component: RisksPage },
      { path: "risk/library", Component: RiskLibraryPage },
      { path: "risk/action-tracker", Component: ActionTrackerPage },
      { path: "risk/snapshot", Component: SnapshotPage },
      { path: "risk/settings", Component: RiskSettingsPage },

      // Vendors
      { path: "vendors", Component: VendorsPage },

      // Privacy routes
      { path: "privacy/data-inventory", Component: DataInventoryPage },
      { path: "privacy/settings", Component: PrivacySettingsPage },

      // Assets routes
      { path: "assets/inventory", Component: InventoryPage },
      { path: "assets/code-changes", Component: CodeChangesPage },
      { path: "assets/vulnerabilities", Component: VulnerabilitiesPage },
      { path: "assets/security-alerts", Component: SecurityAlertsPage },
      { path: "assets/settings", Component: AssetsSettingsPage },

      // Personnel routes
      { path: "personnel/people", Component: PeoplePage },
      { path: "personnel/computers", Component: ComputersPage },
      { path: "personnel/access", Component: AccessPage },
      { path: "personnel/settings", Component: PersonnelSettingsPage },

      // Other routes
      { path: "integrations", Component: IntegrationsPage },
      { path: "my-security-tasks", Component: MySecurityTasksPage },
      { path: "my-access-requests", Component: MyAccessRequestsPage },

      // Account
      { path: "account-settings", Component: AccountSettingsPage },
    ],
  },
]);
