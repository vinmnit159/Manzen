/**
 * frameworkSeeds.ts
 *
 * Seeds the global framework catalog: `frameworks` and `framework_requirements` tables.
 * These are not tenant-specific. Runs once at boot when RISK_ENGINE_AUTO_SEED=true.
 * All inserts use ON CONFLICT DO NOTHING — safe to re-run.
 */

import type { SqlExecutor } from './persistence';

interface FrameworkSeed {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string;
}

interface RequirementSeed {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  domain: string;
}

// ── Framework catalog ─────────────────────────────────────────────────────────

const FRAMEWORKS: FrameworkSeed[] = [
  {
    id: 'fw-iso27001',
    slug: 'iso-27001',
    name: 'ISO 27001',
    version: '2022',
    description: 'International standard for information security management systems (ISMS). Annex A contains 93 controls across 4 themes.',
  },
  {
    id: 'fw-soc2',
    slug: 'soc-2',
    name: 'SOC 2 Type II',
    version: '2017',
    description: 'AICPA Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.',
  },
  {
    id: 'fw-nist-csf',
    slug: 'nist-csf',
    name: 'NIST CSF',
    version: '2.0',
    description: 'NIST Cybersecurity Framework 2.0 — 6 functions, 22 categories, 106 subcategories.',
  },
  {
    id: 'fw-hipaa',
    slug: 'hipaa',
    name: 'HIPAA Security Rule',
    version: '2013',
    description: 'HIPAA Security Rule safeguards for electronic protected health information (ePHI).',
  },
];

// ── Requirements ─────────────────────────────────────────────────────────────

const ISO_27001_REQUIREMENTS: RequirementSeed[] = [
  // A.5 — Organisational controls (37)
  { id: 'req-iso-a51',  frameworkId: 'fw-iso27001', code: 'A.5.1',  title: 'Policies for information security',           domain: 'Organisational controls' },
  { id: 'req-iso-a52',  frameworkId: 'fw-iso27001', code: 'A.5.2',  title: 'Information security roles and responsibilities', domain: 'Organisational controls' },
  { id: 'req-iso-a53',  frameworkId: 'fw-iso27001', code: 'A.5.3',  title: 'Segregation of duties',                       domain: 'Organisational controls' },
  { id: 'req-iso-a54',  frameworkId: 'fw-iso27001', code: 'A.5.4',  title: 'Management responsibilities',                 domain: 'Organisational controls' },
  { id: 'req-iso-a55',  frameworkId: 'fw-iso27001', code: 'A.5.5',  title: 'Contact with authorities',                    domain: 'Organisational controls' },
  { id: 'req-iso-a56',  frameworkId: 'fw-iso27001', code: 'A.5.6',  title: 'Contact with special interest groups',        domain: 'Organisational controls' },
  { id: 'req-iso-a57',  frameworkId: 'fw-iso27001', code: 'A.5.7',  title: 'Threat intelligence',                         domain: 'Organisational controls' },
  { id: 'req-iso-a58',  frameworkId: 'fw-iso27001', code: 'A.5.8',  title: 'Information security in project management',  domain: 'Organisational controls' },
  { id: 'req-iso-a59',  frameworkId: 'fw-iso27001', code: 'A.5.9',  title: 'Inventory of information and other associated assets', domain: 'Organisational controls' },
  { id: 'req-iso-a510', frameworkId: 'fw-iso27001', code: 'A.5.10', title: 'Acceptable use of information and other associated assets', domain: 'Organisational controls' },
  { id: 'req-iso-a511', frameworkId: 'fw-iso27001', code: 'A.5.11', title: 'Return of assets',                            domain: 'Organisational controls' },
  { id: 'req-iso-a512', frameworkId: 'fw-iso27001', code: 'A.5.12', title: 'Classification of information',              domain: 'Organisational controls' },
  { id: 'req-iso-a513', frameworkId: 'fw-iso27001', code: 'A.5.13', title: 'Labelling of information',                   domain: 'Organisational controls' },
  { id: 'req-iso-a514', frameworkId: 'fw-iso27001', code: 'A.5.14', title: 'Information transfer',                       domain: 'Organisational controls' },
  { id: 'req-iso-a515', frameworkId: 'fw-iso27001', code: 'A.5.15', title: 'Access control',                             domain: 'Organisational controls' },
  { id: 'req-iso-a516', frameworkId: 'fw-iso27001', code: 'A.5.16', title: 'Identity management',                        domain: 'Organisational controls' },
  { id: 'req-iso-a517', frameworkId: 'fw-iso27001', code: 'A.5.17', title: 'Authentication information',                 domain: 'Organisational controls' },
  { id: 'req-iso-a518', frameworkId: 'fw-iso27001', code: 'A.5.18', title: 'Access rights',                              domain: 'Organisational controls' },
  { id: 'req-iso-a519', frameworkId: 'fw-iso27001', code: 'A.5.19', title: 'Information security in supplier relationships', domain: 'Organisational controls' },
  { id: 'req-iso-a520', frameworkId: 'fw-iso27001', code: 'A.5.20', title: 'Addressing information security within supplier agreements', domain: 'Organisational controls' },
  { id: 'req-iso-a521', frameworkId: 'fw-iso27001', code: 'A.5.21', title: 'Managing information security in the ICT supply chain', domain: 'Organisational controls' },
  { id: 'req-iso-a522', frameworkId: 'fw-iso27001', code: 'A.5.22', title: 'Monitoring, review and change management of supplier services', domain: 'Organisational controls' },
  { id: 'req-iso-a523', frameworkId: 'fw-iso27001', code: 'A.5.23', title: 'Information security for use of cloud services', domain: 'Organisational controls' },
  { id: 'req-iso-a524', frameworkId: 'fw-iso27001', code: 'A.5.24', title: 'Information security incident management planning and preparation', domain: 'Organisational controls' },
  { id: 'req-iso-a525', frameworkId: 'fw-iso27001', code: 'A.5.25', title: 'Assessment and decision on information security events', domain: 'Organisational controls' },
  { id: 'req-iso-a526', frameworkId: 'fw-iso27001', code: 'A.5.26', title: 'Response to information security incidents',  domain: 'Organisational controls' },
  { id: 'req-iso-a527', frameworkId: 'fw-iso27001', code: 'A.5.27', title: 'Learning from information security incidents', domain: 'Organisational controls' },
  { id: 'req-iso-a528', frameworkId: 'fw-iso27001', code: 'A.5.28', title: 'Collection of evidence',                     domain: 'Organisational controls' },
  { id: 'req-iso-a529', frameworkId: 'fw-iso27001', code: 'A.5.29', title: 'Information security during disruption',      domain: 'Organisational controls' },
  { id: 'req-iso-a530', frameworkId: 'fw-iso27001', code: 'A.5.30', title: 'ICT readiness for business continuity',       domain: 'Organisational controls' },
  { id: 'req-iso-a531', frameworkId: 'fw-iso27001', code: 'A.5.31', title: 'Legal, statutory, regulatory and contractual requirements', domain: 'Organisational controls' },
  { id: 'req-iso-a532', frameworkId: 'fw-iso27001', code: 'A.5.32', title: 'Intellectual property rights',               domain: 'Organisational controls' },
  { id: 'req-iso-a533', frameworkId: 'fw-iso27001', code: 'A.5.33', title: 'Protection of records',                      domain: 'Organisational controls' },
  { id: 'req-iso-a534', frameworkId: 'fw-iso27001', code: 'A.5.34', title: 'Privacy and protection of personal identifiable information (PII)', domain: 'Organisational controls' },
  { id: 'req-iso-a535', frameworkId: 'fw-iso27001', code: 'A.5.35', title: 'Independent review of information security', domain: 'Organisational controls' },
  { id: 'req-iso-a536', frameworkId: 'fw-iso27001', code: 'A.5.36', title: 'Compliance with policies, rules and standards for information security', domain: 'Organisational controls' },
  { id: 'req-iso-a537', frameworkId: 'fw-iso27001', code: 'A.5.37', title: 'Documented operating procedures',            domain: 'Organisational controls' },
  // A.6 — People controls (8)
  { id: 'req-iso-a61', frameworkId: 'fw-iso27001', code: 'A.6.1', title: 'Screening',                                    domain: 'People controls' },
  { id: 'req-iso-a62', frameworkId: 'fw-iso27001', code: 'A.6.2', title: 'Terms and conditions of employment',           domain: 'People controls' },
  { id: 'req-iso-a63', frameworkId: 'fw-iso27001', code: 'A.6.3', title: 'Information security awareness, education and training', domain: 'People controls' },
  { id: 'req-iso-a64', frameworkId: 'fw-iso27001', code: 'A.6.4', title: 'Disciplinary process',                        domain: 'People controls' },
  { id: 'req-iso-a65', frameworkId: 'fw-iso27001', code: 'A.6.5', title: 'Responsibilities after termination or change of employment', domain: 'People controls' },
  { id: 'req-iso-a66', frameworkId: 'fw-iso27001', code: 'A.6.6', title: 'Confidentiality or non-disclosure agreements', domain: 'People controls' },
  { id: 'req-iso-a67', frameworkId: 'fw-iso27001', code: 'A.6.7', title: 'Remote working',                               domain: 'People controls' },
  { id: 'req-iso-a68', frameworkId: 'fw-iso27001', code: 'A.6.8', title: 'Information security event reporting',         domain: 'People controls' },
  // A.7 — Physical controls (14)
  { id: 'req-iso-a71',  frameworkId: 'fw-iso27001', code: 'A.7.1',  title: 'Physical security perimeters',               domain: 'Physical controls' },
  { id: 'req-iso-a72',  frameworkId: 'fw-iso27001', code: 'A.7.2',  title: 'Physical entry',                             domain: 'Physical controls' },
  { id: 'req-iso-a73',  frameworkId: 'fw-iso27001', code: 'A.7.3',  title: 'Securing offices, rooms and facilities',     domain: 'Physical controls' },
  { id: 'req-iso-a74',  frameworkId: 'fw-iso27001', code: 'A.7.4',  title: 'Physical security monitoring',               domain: 'Physical controls' },
  { id: 'req-iso-a75',  frameworkId: 'fw-iso27001', code: 'A.7.5',  title: 'Protecting against physical and environmental threats', domain: 'Physical controls' },
  { id: 'req-iso-a76',  frameworkId: 'fw-iso27001', code: 'A.7.6',  title: 'Working in secure areas',                   domain: 'Physical controls' },
  { id: 'req-iso-a77',  frameworkId: 'fw-iso27001', code: 'A.7.7',  title: 'Clear desk and clear screen',               domain: 'Physical controls' },
  { id: 'req-iso-a78',  frameworkId: 'fw-iso27001', code: 'A.7.8',  title: 'Equipment siting and protection',           domain: 'Physical controls' },
  { id: 'req-iso-a79',  frameworkId: 'fw-iso27001', code: 'A.7.9',  title: 'Security of assets off-premises',           domain: 'Physical controls' },
  { id: 'req-iso-a710', frameworkId: 'fw-iso27001', code: 'A.7.10', title: 'Storage media',                             domain: 'Physical controls' },
  { id: 'req-iso-a711', frameworkId: 'fw-iso27001', code: 'A.7.11', title: 'Supporting utilities',                      domain: 'Physical controls' },
  { id: 'req-iso-a712', frameworkId: 'fw-iso27001', code: 'A.7.12', title: 'Cabling security',                          domain: 'Physical controls' },
  { id: 'req-iso-a713', frameworkId: 'fw-iso27001', code: 'A.7.13', title: 'Equipment maintenance',                     domain: 'Physical controls' },
  { id: 'req-iso-a714', frameworkId: 'fw-iso27001', code: 'A.7.14', title: 'Secure disposal or re-use of equipment',    domain: 'Physical controls' },
  // A.8 — Technological controls (34)
  { id: 'req-iso-a81',  frameworkId: 'fw-iso27001', code: 'A.8.1',  title: 'User end point devices',                    domain: 'Technological controls' },
  { id: 'req-iso-a82',  frameworkId: 'fw-iso27001', code: 'A.8.2',  title: 'Privileged access rights',                  domain: 'Technological controls' },
  { id: 'req-iso-a83',  frameworkId: 'fw-iso27001', code: 'A.8.3',  title: 'Information access restriction',            domain: 'Technological controls' },
  { id: 'req-iso-a84',  frameworkId: 'fw-iso27001', code: 'A.8.4',  title: 'Access to source code',                     domain: 'Technological controls' },
  { id: 'req-iso-a85',  frameworkId: 'fw-iso27001', code: 'A.8.5',  title: 'Secure authentication',                     domain: 'Technological controls' },
  { id: 'req-iso-a86',  frameworkId: 'fw-iso27001', code: 'A.8.6',  title: 'Capacity management',                       domain: 'Technological controls' },
  { id: 'req-iso-a87',  frameworkId: 'fw-iso27001', code: 'A.8.7',  title: 'Protection against malware',                domain: 'Technological controls' },
  { id: 'req-iso-a88',  frameworkId: 'fw-iso27001', code: 'A.8.8',  title: 'Management of technical vulnerabilities',   domain: 'Technological controls' },
  { id: 'req-iso-a89',  frameworkId: 'fw-iso27001', code: 'A.8.9',  title: 'Configuration management',                  domain: 'Technological controls' },
  { id: 'req-iso-a810', frameworkId: 'fw-iso27001', code: 'A.8.10', title: 'Information deletion',                      domain: 'Technological controls' },
  { id: 'req-iso-a811', frameworkId: 'fw-iso27001', code: 'A.8.11', title: 'Data masking',                              domain: 'Technological controls' },
  { id: 'req-iso-a812', frameworkId: 'fw-iso27001', code: 'A.8.12', title: 'Data leakage prevention',                   domain: 'Technological controls' },
  { id: 'req-iso-a813', frameworkId: 'fw-iso27001', code: 'A.8.13', title: 'Information backup',                        domain: 'Technological controls' },
  { id: 'req-iso-a814', frameworkId: 'fw-iso27001', code: 'A.8.14', title: 'Redundancy of information processing facilities', domain: 'Technological controls' },
  { id: 'req-iso-a815', frameworkId: 'fw-iso27001', code: 'A.8.15', title: 'Logging',                                   domain: 'Technological controls' },
  { id: 'req-iso-a816', frameworkId: 'fw-iso27001', code: 'A.8.16', title: 'Monitoring activities',                     domain: 'Technological controls' },
  { id: 'req-iso-a817', frameworkId: 'fw-iso27001', code: 'A.8.17', title: 'Clock synchronisation',                     domain: 'Technological controls' },
  { id: 'req-iso-a818', frameworkId: 'fw-iso27001', code: 'A.8.18', title: 'Use of privileged utility programs',        domain: 'Technological controls' },
  { id: 'req-iso-a819', frameworkId: 'fw-iso27001', code: 'A.8.19', title: 'Installation of software on operational systems', domain: 'Technological controls' },
  { id: 'req-iso-a820', frameworkId: 'fw-iso27001', code: 'A.8.20', title: 'Networks security',                         domain: 'Technological controls' },
  { id: 'req-iso-a821', frameworkId: 'fw-iso27001', code: 'A.8.21', title: 'Security of network services',              domain: 'Technological controls' },
  { id: 'req-iso-a822', frameworkId: 'fw-iso27001', code: 'A.8.22', title: 'Segregation of networks',                   domain: 'Technological controls' },
  { id: 'req-iso-a823', frameworkId: 'fw-iso27001', code: 'A.8.23', title: 'Web filtering',                             domain: 'Technological controls' },
  { id: 'req-iso-a824', frameworkId: 'fw-iso27001', code: 'A.8.24', title: 'Use of cryptography',                       domain: 'Technological controls' },
  { id: 'req-iso-a825', frameworkId: 'fw-iso27001', code: 'A.8.25', title: 'Secure development life cycle',             domain: 'Technological controls' },
  { id: 'req-iso-a826', frameworkId: 'fw-iso27001', code: 'A.8.26', title: 'Application security requirements',         domain: 'Technological controls' },
  { id: 'req-iso-a827', frameworkId: 'fw-iso27001', code: 'A.8.27', title: 'Secure system architecture and engineering principles', domain: 'Technological controls' },
  { id: 'req-iso-a828', frameworkId: 'fw-iso27001', code: 'A.8.28', title: 'Secure coding',                             domain: 'Technological controls' },
  { id: 'req-iso-a829', frameworkId: 'fw-iso27001', code: 'A.8.29', title: 'Security testing in development and acceptance', domain: 'Technological controls' },
  { id: 'req-iso-a830', frameworkId: 'fw-iso27001', code: 'A.8.30', title: 'Outsourced development',                    domain: 'Technological controls' },
  { id: 'req-iso-a831', frameworkId: 'fw-iso27001', code: 'A.8.31', title: 'Separation of development, test and production environments', domain: 'Technological controls' },
  { id: 'req-iso-a832', frameworkId: 'fw-iso27001', code: 'A.8.32', title: 'Change management',                         domain: 'Technological controls' },
  { id: 'req-iso-a833', frameworkId: 'fw-iso27001', code: 'A.8.33', title: 'Test information',                          domain: 'Technological controls' },
  { id: 'req-iso-a834', frameworkId: 'fw-iso27001', code: 'A.8.34', title: 'Protection of information systems during audit testing', domain: 'Technological controls' },
];

const SOC2_REQUIREMENTS: RequirementSeed[] = [
  // CC1 — Control Environment
  { id: 'req-soc2-cc11', frameworkId: 'fw-soc2', code: 'CC1.1', title: 'COSO Principle 1: Demonstrates Commitment to Integrity and Ethical Values', domain: 'Control Environment' },
  { id: 'req-soc2-cc12', frameworkId: 'fw-soc2', code: 'CC1.2', title: 'COSO Principle 2: Board Exercises Oversight Responsibility',               domain: 'Control Environment' },
  { id: 'req-soc2-cc13', frameworkId: 'fw-soc2', code: 'CC1.3', title: 'COSO Principle 3: Establishes Structure, Authority, and Responsibility',   domain: 'Control Environment' },
  { id: 'req-soc2-cc14', frameworkId: 'fw-soc2', code: 'CC1.4', title: 'COSO Principle 4: Demonstrates Commitment to Competence',                  domain: 'Control Environment' },
  { id: 'req-soc2-cc15', frameworkId: 'fw-soc2', code: 'CC1.5', title: 'COSO Principle 5: Enforces Accountability',                                domain: 'Control Environment' },
  // CC2 — Communication and Information
  { id: 'req-soc2-cc21', frameworkId: 'fw-soc2', code: 'CC2.1', title: 'COSO Principle 13: Uses Relevant Information',                             domain: 'Communication and Information' },
  { id: 'req-soc2-cc22', frameworkId: 'fw-soc2', code: 'CC2.2', title: 'COSO Principle 14: Communicates Internally',                               domain: 'Communication and Information' },
  { id: 'req-soc2-cc23', frameworkId: 'fw-soc2', code: 'CC2.3', title: 'COSO Principle 15: Communicates Externally',                               domain: 'Communication and Information' },
  // CC3 — Risk Assessment
  { id: 'req-soc2-cc31', frameworkId: 'fw-soc2', code: 'CC3.1', title: 'COSO Principle 6: Specifies Suitable Objectives',                          domain: 'Risk Assessment' },
  { id: 'req-soc2-cc32', frameworkId: 'fw-soc2', code: 'CC3.2', title: 'COSO Principle 7: Identifies and Analyzes Risk',                           domain: 'Risk Assessment' },
  { id: 'req-soc2-cc33', frameworkId: 'fw-soc2', code: 'CC3.3', title: 'COSO Principle 8: Assesses Fraud Risk',                                    domain: 'Risk Assessment' },
  { id: 'req-soc2-cc34', frameworkId: 'fw-soc2', code: 'CC3.4', title: 'COSO Principle 9: Identifies and Analyzes Significant Change',             domain: 'Risk Assessment' },
  // CC4 — Monitoring
  { id: 'req-soc2-cc41', frameworkId: 'fw-soc2', code: 'CC4.1', title: 'COSO Principle 16: Conducts Ongoing and/or Separate Evaluations',          domain: 'Monitoring Activities' },
  { id: 'req-soc2-cc42', frameworkId: 'fw-soc2', code: 'CC4.2', title: 'COSO Principle 17: Evaluates and Communicates Deficiencies',               domain: 'Monitoring Activities' },
  // CC5 — Control Activities
  { id: 'req-soc2-cc51', frameworkId: 'fw-soc2', code: 'CC5.1', title: 'COSO Principle 10: Selects and Develops Control Activities',               domain: 'Control Activities' },
  { id: 'req-soc2-cc52', frameworkId: 'fw-soc2', code: 'CC5.2', title: 'COSO Principle 11: Selects and Develops General Controls over Technology',  domain: 'Control Activities' },
  { id: 'req-soc2-cc53', frameworkId: 'fw-soc2', code: 'CC5.3', title: 'COSO Principle 12: Deploys Through Policies and Procedures',               domain: 'Control Activities' },
  // CC6 — Logical and Physical Access
  { id: 'req-soc2-cc61', frameworkId: 'fw-soc2', code: 'CC6.1', title: 'Implements logical access security software, infrastructure, and architectures', domain: 'Logical and Physical Access' },
  { id: 'req-soc2-cc62', frameworkId: 'fw-soc2', code: 'CC6.2', title: 'Prior to issuing system credentials, registers and authorizes new users',  domain: 'Logical and Physical Access' },
  { id: 'req-soc2-cc63', frameworkId: 'fw-soc2', code: 'CC6.3', title: 'Roles and responsibilities for authorization are established',             domain: 'Logical and Physical Access' },
  { id: 'req-soc2-cc64', frameworkId: 'fw-soc2', code: 'CC6.4', title: 'Restricts physical access to facilities and protected information assets', domain: 'Logical and Physical Access' },
  { id: 'req-soc2-cc65', frameworkId: 'fw-soc2', code: 'CC6.5', title: 'Logical access to assets is removed when no longer authorized',            domain: 'Logical and Physical Access' },
  { id: 'req-soc2-cc66', frameworkId: 'fw-soc2', code: 'CC6.6', title: 'Logical access security measures against threats from outside system boundaries', domain: 'Logical and Physical Access' },
  { id: 'req-soc2-cc67', frameworkId: 'fw-soc2', code: 'CC6.7', title: 'Controls the transmission, movement, and removal of information',          domain: 'Logical and Physical Access' },
  { id: 'req-soc2-cc68', frameworkId: 'fw-soc2', code: 'CC6.8', title: 'Implements controls to prevent or detect and act upon malware',            domain: 'Logical and Physical Access' },
  // CC7 — System Operations
  { id: 'req-soc2-cc71', frameworkId: 'fw-soc2', code: 'CC7.1', title: 'Detects and monitors for new vulnerabilities',                             domain: 'System Operations' },
  { id: 'req-soc2-cc72', frameworkId: 'fw-soc2', code: 'CC7.2', title: 'Monitors system components for anomalous behaviour',                       domain: 'System Operations' },
  { id: 'req-soc2-cc73', frameworkId: 'fw-soc2', code: 'CC7.3', title: 'Evaluates security events to determine if they are incidents',             domain: 'System Operations' },
  { id: 'req-soc2-cc74', frameworkId: 'fw-soc2', code: 'CC7.4', title: 'Responds to identified security incidents',                               domain: 'System Operations' },
  { id: 'req-soc2-cc75', frameworkId: 'fw-soc2', code: 'CC7.5', title: 'Identifies, develops, and implements activities to recover from incidents', domain: 'System Operations' },
  // CC8 — Change Management
  { id: 'req-soc2-cc81', frameworkId: 'fw-soc2', code: 'CC8.1', title: 'Authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes', domain: 'Change Management' },
  // CC9 — Risk Mitigation
  { id: 'req-soc2-cc91', frameworkId: 'fw-soc2', code: 'CC9.1', title: 'Identifies, selects, and develops risk mitigation activities',             domain: 'Risk Mitigation' },
  { id: 'req-soc2-cc92', frameworkId: 'fw-soc2', code: 'CC9.2', title: 'Assesses and manages risks associated with vendors and business partners', domain: 'Risk Mitigation' },
];

const NIST_CSF_REQUIREMENTS: RequirementSeed[] = [
  // GV — Govern
  { id: 'req-nist-gvoc1',  frameworkId: 'fw-nist-csf', code: 'GV.OC-01', title: 'Organizational mission is understood',                              domain: 'Govern' },
  { id: 'req-nist-gvoc2',  frameworkId: 'fw-nist-csf', code: 'GV.OC-02', title: 'Stakeholders with interest in cybersecurity are determined',         domain: 'Govern' },
  { id: 'req-nist-gvoc3',  frameworkId: 'fw-nist-csf', code: 'GV.OC-03', title: 'Legal, regulatory, and contractual requirements are understood',     domain: 'Govern' },
  { id: 'req-nist-gvoc4',  frameworkId: 'fw-nist-csf', code: 'GV.OC-04', title: 'Critical objectives, capabilities, and services are understood',     domain: 'Govern' },
  { id: 'req-nist-gvoc5',  frameworkId: 'fw-nist-csf', code: 'GV.OC-05', title: 'Outcomes, capabilities, and services that external parties depend on are understood', domain: 'Govern' },
  { id: 'req-nist-gvrm1',  frameworkId: 'fw-nist-csf', code: 'GV.RM-01', title: 'Risk management objectives are established',                         domain: 'Govern' },
  { id: 'req-nist-gvrm2',  frameworkId: 'fw-nist-csf', code: 'GV.RM-02', title: 'Risk appetite and risk tolerance statements are established',         domain: 'Govern' },
  { id: 'req-nist-gvrm3',  frameworkId: 'fw-nist-csf', code: 'GV.RM-03', title: 'Cybersecurity risk management activities are integrated',            domain: 'Govern' },
  { id: 'req-nist-gvrm4',  frameworkId: 'fw-nist-csf', code: 'GV.RM-04', title: 'Strategic direction for managing cybersecurity supply chain risk',    domain: 'Govern' },
  { id: 'req-nist-gvrm5',  frameworkId: 'fw-nist-csf', code: 'GV.RM-05', title: 'Lines of communication across the organization',                     domain: 'Govern' },
  { id: 'req-nist-gvrm6',  frameworkId: 'fw-nist-csf', code: 'GV.RM-06', title: 'A standardized method for calculating, documenting, categorizing and prioritizing cybersecurity risks', domain: 'Govern' },
  { id: 'req-nist-gvrm7',  frameworkId: 'fw-nist-csf', code: 'GV.RM-07', title: 'Strategic opportunities arising from cybersecurity risk management are characterized', domain: 'Govern' },
  // ID — Identify
  { id: 'req-nist-idam1', frameworkId: 'fw-nist-csf', code: 'ID.AM-01', title: 'Inventories of hardware managed by the organization are maintained',  domain: 'Identify' },
  { id: 'req-nist-idam2', frameworkId: 'fw-nist-csf', code: 'ID.AM-02', title: 'Inventories of software, services, and systems are maintained',       domain: 'Identify' },
  { id: 'req-nist-idam3', frameworkId: 'fw-nist-csf', code: 'ID.AM-03', title: 'Representations of the organization network and communications are maintained', domain: 'Identify' },
  { id: 'req-nist-idam4', frameworkId: 'fw-nist-csf', code: 'ID.AM-04', title: 'Inventories of services provided by suppliers are maintained',        domain: 'Identify' },
  { id: 'req-nist-idam5', frameworkId: 'fw-nist-csf', code: 'ID.AM-05', title: 'Assets are prioritized based on classification, criticality, resources, and impact', domain: 'Identify' },
  { id: 'req-nist-idam6', frameworkId: 'fw-nist-csf', code: 'ID.AM-07', title: 'Inventories of data and corresponding metadata are maintained',       domain: 'Identify' },
  { id: 'req-nist-idam7', frameworkId: 'fw-nist-csf', code: 'ID.AM-08', title: 'Systems, hardware, software, services, and data are managed',         domain: 'Identify' },
  { id: 'req-nist-idra1', frameworkId: 'fw-nist-csf', code: 'ID.RA-01', title: 'Vulnerabilities in assets are identified, validated, and recorded',   domain: 'Identify' },
  { id: 'req-nist-idra2', frameworkId: 'fw-nist-csf', code: 'ID.RA-02', title: 'Cyber threat intelligence is received from information sharing forums', domain: 'Identify' },
  { id: 'req-nist-idra3', frameworkId: 'fw-nist-csf', code: 'ID.RA-03', title: 'Internal and external threats to the organization are identified',    domain: 'Identify' },
  { id: 'req-nist-idra4', frameworkId: 'fw-nist-csf', code: 'ID.RA-04', title: 'Potential impacts and likelihoods of threats are identified',         domain: 'Identify' },
  { id: 'req-nist-idra5', frameworkId: 'fw-nist-csf', code: 'ID.RA-05', title: 'Threats, vulnerabilities, likelihoods, and impacts are used to understand risk', domain: 'Identify' },
  { id: 'req-nist-idra6', frameworkId: 'fw-nist-csf', code: 'ID.RA-06', title: 'Risk responses are chosen, prioritized, planned, tracked, and communicated', domain: 'Identify' },
  { id: 'req-nist-idra7', frameworkId: 'fw-nist-csf', code: 'ID.RA-07', title: 'Changes and exceptions are managed, assessed for risk impact, recorded', domain: 'Identify' },
  { id: 'req-nist-idra8', frameworkId: 'fw-nist-csf', code: 'ID.RA-08', title: 'Processes for receiving, analyzing, and responding to vulnerability disclosures', domain: 'Identify' },
  { id: 'req-nist-idra9', frameworkId: 'fw-nist-csf', code: 'ID.RA-09', title: 'The authenticity and integrity of hardware and software are assessed',  domain: 'Identify' },
  { id: 'req-nist-idim1', frameworkId: 'fw-nist-csf', code: 'ID.IM-01', title: 'Improvements are identified from evaluations',                        domain: 'Identify' },
  { id: 'req-nist-idim2', frameworkId: 'fw-nist-csf', code: 'ID.IM-02', title: 'Improvements are identified from security tests and exercises',       domain: 'Identify' },
  { id: 'req-nist-idim3', frameworkId: 'fw-nist-csf', code: 'ID.IM-03', title: 'Improvements are identified from execution of operational processes', domain: 'Identify' },
  { id: 'req-nist-idim4', frameworkId: 'fw-nist-csf', code: 'ID.IM-04', title: 'Incident response plans and other cybersecurity plans are established', domain: 'Identify' },
  // PR — Protect
  { id: 'req-nist-praa1', frameworkId: 'fw-nist-csf', code: 'PR.AA-01', title: 'Identities and credentials for authorized users, services, and hardware are managed', domain: 'Protect' },
  { id: 'req-nist-praa2', frameworkId: 'fw-nist-csf', code: 'PR.AA-02', title: 'Identities are proofed and bound to credentials based on the context of interactions', domain: 'Protect' },
  { id: 'req-nist-praa3', frameworkId: 'fw-nist-csf', code: 'PR.AA-03', title: 'Users, services, and hardware are authenticated',                    domain: 'Protect' },
  { id: 'req-nist-praa4', frameworkId: 'fw-nist-csf', code: 'PR.AA-04', title: 'Identity assertions are protected, conveyed, and verified',           domain: 'Protect' },
  { id: 'req-nist-praa5', frameworkId: 'fw-nist-csf', code: 'PR.AA-05', title: 'Access permissions, entitlements, and authorizations are defined',    domain: 'Protect' },
  { id: 'req-nist-praa6', frameworkId: 'fw-nist-csf', code: 'PR.AA-06', title: 'Physical access to assets is managed, monitored, and enforced',       domain: 'Protect' },
  { id: 'req-nist-prat1', frameworkId: 'fw-nist-csf', code: 'PR.AT-01', title: 'Personnel are provided awareness and training',                       domain: 'Protect' },
  { id: 'req-nist-prds1', frameworkId: 'fw-nist-csf', code: 'PR.DS-01', title: 'The confidentiality, integrity, and availability of data-at-rest are protected', domain: 'Protect' },
  { id: 'req-nist-prds2', frameworkId: 'fw-nist-csf', code: 'PR.DS-02', title: 'The confidentiality, integrity, and availability of data-in-transit are protected', domain: 'Protect' },
  { id: 'req-nist-prds3', frameworkId: 'fw-nist-csf', code: 'PR.DS-10', title: 'The confidentiality, integrity, and availability of data-in-use are protected', domain: 'Protect' },
  { id: 'req-nist-prds4', frameworkId: 'fw-nist-csf', code: 'PR.DS-11', title: 'Backups of data are created, protected, maintained, and tested',      domain: 'Protect' },
  { id: 'req-nist-prps1', frameworkId: 'fw-nist-csf', code: 'PR.PS-01', title: 'Configuration management practices are established and applied',      domain: 'Protect' },
  { id: 'req-nist-prps2', frameworkId: 'fw-nist-csf', code: 'PR.PS-02', title: 'Software is maintained, replaced, and removed commensurate with risk', domain: 'Protect' },
  { id: 'req-nist-prps3', frameworkId: 'fw-nist-csf', code: 'PR.PS-03', title: 'Hardware is maintained, replaced, and removed commensurate with risk', domain: 'Protect' },
  { id: 'req-nist-prps4', frameworkId: 'fw-nist-csf', code: 'PR.PS-04', title: 'Log records are generated and made available',                        domain: 'Protect' },
  { id: 'req-nist-prps5', frameworkId: 'fw-nist-csf', code: 'PR.PS-05', title: 'Installation and execution of unauthorized software are prevented',   domain: 'Protect' },
  { id: 'req-nist-prps6', frameworkId: 'fw-nist-csf', code: 'PR.PS-06', title: 'Secure software development practices are integrated',                domain: 'Protect' },
  { id: 'req-nist-prir1', frameworkId: 'fw-nist-csf', code: 'PR.IR-01', title: 'Networks and environments are protected from unauthorized logical access', domain: 'Protect' },
  { id: 'req-nist-prir2', frameworkId: 'fw-nist-csf', code: 'PR.IR-02', title: 'The organization network is protected from unauthorized physical access', domain: 'Protect' },
  { id: 'req-nist-prir3', frameworkId: 'fw-nist-csf', code: 'PR.IR-03', title: 'Mechanisms to achieve resilience requirements in normal and adverse situations', domain: 'Protect' },
  { id: 'req-nist-prir4', frameworkId: 'fw-nist-csf', code: 'PR.IR-04', title: 'Adequate resource capacity to ensure availability is maintained',    domain: 'Protect' },
  // DE — Detect
  { id: 'req-nist-decm1', frameworkId: 'fw-nist-csf', code: 'DE.CM-01', title: 'Networks and network services are monitored',                         domain: 'Detect' },
  { id: 'req-nist-decm2', frameworkId: 'fw-nist-csf', code: 'DE.CM-02', title: 'The physical environment is monitored',                               domain: 'Detect' },
  { id: 'req-nist-decm3', frameworkId: 'fw-nist-csf', code: 'DE.CM-03', title: 'Personnel activity and technology usage are monitored',               domain: 'Detect' },
  { id: 'req-nist-decm4', frameworkId: 'fw-nist-csf', code: 'DE.CM-06', title: 'External service provider activities and services are monitored',     domain: 'Detect' },
  { id: 'req-nist-decm5', frameworkId: 'fw-nist-csf', code: 'DE.CM-09', title: 'Computing hardware and software, runtime environments, and their data are monitored', domain: 'Detect' },
  { id: 'req-nist-deae1', frameworkId: 'fw-nist-csf', code: 'DE.AE-02', title: 'Potentially adverse events are analyzed to better understand associated activities', domain: 'Detect' },
  { id: 'req-nist-deae2', frameworkId: 'fw-nist-csf', code: 'DE.AE-03', title: 'Information is correlated from multiple sources',                    domain: 'Detect' },
  { id: 'req-nist-deae3', frameworkId: 'fw-nist-csf', code: 'DE.AE-04', title: 'The estimated impact and scope of adverse events are understood',     domain: 'Detect' },
  { id: 'req-nist-deae4', frameworkId: 'fw-nist-csf', code: 'DE.AE-06', title: 'Information on adverse events is provided to authorized staff',       domain: 'Detect' },
  { id: 'req-nist-deae5', frameworkId: 'fw-nist-csf', code: 'DE.AE-07', title: 'Cyber threat intelligence and other contextual information are integrated', domain: 'Detect' },
  { id: 'req-nist-deae6', frameworkId: 'fw-nist-csf', code: 'DE.AE-08', title: 'Incidents are declared when adverse events meet the defined criteria', domain: 'Detect' },
  // RS — Respond
  { id: 'req-nist-rsma1', frameworkId: 'fw-nist-csf', code: 'RS.MA-01', title: 'The incident response plan is executed in coordination with relevant third parties', domain: 'Respond' },
  { id: 'req-nist-rsma2', frameworkId: 'fw-nist-csf', code: 'RS.MA-02', title: 'Incident reports are triaged and validated',                          domain: 'Respond' },
  { id: 'req-nist-rsma3', frameworkId: 'fw-nist-csf', code: 'RS.MA-03', title: 'Incidents are categorized and prioritized',                           domain: 'Respond' },
  { id: 'req-nist-rsma4', frameworkId: 'fw-nist-csf', code: 'RS.MA-04', title: 'Incidents are escalated or elevated as needed',                       domain: 'Respond' },
  { id: 'req-nist-rsma5', frameworkId: 'fw-nist-csf', code: 'RS.MA-05', title: 'The criteria for initiating incident recovery are applied',           domain: 'Respond' },
  { id: 'req-nist-rsan1', frameworkId: 'fw-nist-csf', code: 'RS.AN-03', title: 'Analysis is performed to establish what has taken place during an incident', domain: 'Respond' },
  { id: 'req-nist-rsan2', frameworkId: 'fw-nist-csf', code: 'RS.AN-06', title: 'Actions performed during an investigation are recorded',              domain: 'Respond' },
  { id: 'req-nist-rsan3', frameworkId: 'fw-nist-csf', code: 'RS.AN-07', title: 'Incident cause is determined',                                        domain: 'Respond' },
  { id: 'req-nist-rsan4', frameworkId: 'fw-nist-csf', code: 'RS.AN-08', title: 'Incidents are categorized consistent with response plans',            domain: 'Respond' },
  { id: 'req-nist-rsco1', frameworkId: 'fw-nist-csf', code: 'RS.CO-02', title: 'Internal and external stakeholders are notified of incidents',        domain: 'Respond' },
  { id: 'req-nist-rsco2', frameworkId: 'fw-nist-csf', code: 'RS.CO-03', title: 'Information is shared with designated internal and external stakeholders', domain: 'Respond' },
  { id: 'req-nist-rsmi1', frameworkId: 'fw-nist-csf', code: 'RS.MI-01', title: 'Incidents are contained',                                             domain: 'Respond' },
  { id: 'req-nist-rsmi2', frameworkId: 'fw-nist-csf', code: 'RS.MI-02', title: 'Incidents are eradicated',                                            domain: 'Respond' },
  // RC — Recover
  { id: 'req-nist-rcrp1', frameworkId: 'fw-nist-csf', code: 'RC.RP-01', title: 'The recovery portion of the incident response plan is executed',      domain: 'Recover' },
  { id: 'req-nist-rcrp2', frameworkId: 'fw-nist-csf', code: 'RC.RP-02', title: 'Recovery actions are selected, scoped, prioritized, and performed',   domain: 'Recover' },
  { id: 'req-nist-rcrp3', frameworkId: 'fw-nist-csf', code: 'RC.RP-03', title: 'The integrity of backups and other restoration assets is verified',   domain: 'Recover' },
  { id: 'req-nist-rcrp4', frameworkId: 'fw-nist-csf', code: 'RC.RP-04', title: 'Critical mission functions and cybersecurity capabilities are re-established', domain: 'Recover' },
  { id: 'req-nist-rcrp5', frameworkId: 'fw-nist-csf', code: 'RC.RP-05', title: 'The integrity of restored assets is verified',                        domain: 'Recover' },
  { id: 'req-nist-rcco1', frameworkId: 'fw-nist-csf', code: 'RC.CO-03', title: 'Recovery activities and progress are communicated to stakeholders',   domain: 'Recover' },
  { id: 'req-nist-rcco2', frameworkId: 'fw-nist-csf', code: 'RC.CO-04', title: 'Public updates on incident recovery are shared',                      domain: 'Recover' },
];

const HIPAA_REQUIREMENTS: RequirementSeed[] = [
  // 164.308 — Administrative Safeguards
  { id: 'req-hipaa-30801', frameworkId: 'fw-hipaa', code: '164.308(a)(1)', title: 'Security Management Process',                          domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30802', frameworkId: 'fw-hipaa', code: '164.308(a)(2)', title: 'Assigned Security Responsibility',                     domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30803', frameworkId: 'fw-hipaa', code: '164.308(a)(3)', title: 'Workforce Security',                                   domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30804', frameworkId: 'fw-hipaa', code: '164.308(a)(4)', title: 'Information Access Management',                        domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30805', frameworkId: 'fw-hipaa', code: '164.308(a)(5)', title: 'Security Awareness and Training',                      domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30806', frameworkId: 'fw-hipaa', code: '164.308(a)(6)', title: 'Security Incident Procedures',                        domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30807', frameworkId: 'fw-hipaa', code: '164.308(a)(7)', title: 'Contingency Plan',                                    domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30808', frameworkId: 'fw-hipaa', code: '164.308(a)(8)', title: 'Evaluation',                                          domain: 'Administrative Safeguards' },
  { id: 'req-hipaa-30809', frameworkId: 'fw-hipaa', code: '164.308(b)(1)', title: 'Business Associate Contracts and Other Arrangements',  domain: 'Administrative Safeguards' },
  // 164.310 — Physical Safeguards
  { id: 'req-hipaa-31001', frameworkId: 'fw-hipaa', code: '164.310(a)(1)', title: 'Facility Access Controls',                            domain: 'Physical Safeguards' },
  { id: 'req-hipaa-31002', frameworkId: 'fw-hipaa', code: '164.310(b)',    title: 'Workstation Use',                                     domain: 'Physical Safeguards' },
  { id: 'req-hipaa-31003', frameworkId: 'fw-hipaa', code: '164.310(c)',    title: 'Workstation Security',                                domain: 'Physical Safeguards' },
  { id: 'req-hipaa-31004', frameworkId: 'fw-hipaa', code: '164.310(d)(1)', title: 'Device and Media Controls',                           domain: 'Physical Safeguards' },
  // 164.312 — Technical Safeguards
  { id: 'req-hipaa-31201', frameworkId: 'fw-hipaa', code: '164.312(a)(1)', title: 'Access Control',                                      domain: 'Technical Safeguards' },
  { id: 'req-hipaa-31202', frameworkId: 'fw-hipaa', code: '164.312(b)',    title: 'Audit Controls',                                      domain: 'Technical Safeguards' },
  { id: 'req-hipaa-31203', frameworkId: 'fw-hipaa', code: '164.312(c)(1)', title: 'Integrity',                                           domain: 'Technical Safeguards' },
  { id: 'req-hipaa-31204', frameworkId: 'fw-hipaa', code: '164.312(d)',    title: 'Person or Entity Authentication',                     domain: 'Technical Safeguards' },
  { id: 'req-hipaa-31205', frameworkId: 'fw-hipaa', code: '164.312(e)(1)', title: 'Transmission Security',                               domain: 'Technical Safeguards' },
  // 164.316 — Policies and Procedures
  { id: 'req-hipaa-31601', frameworkId: 'fw-hipaa', code: '164.316(a)',    title: 'Policies and Procedures',                             domain: 'Policies and Procedures' },
  { id: 'req-hipaa-31602', frameworkId: 'fw-hipaa', code: '164.316(b)(1)', title: 'Documentation',                                      domain: 'Policies and Procedures' },
];

const ALL_REQUIREMENTS: RequirementSeed[] = [
  ...ISO_27001_REQUIREMENTS,
  ...SOC2_REQUIREMENTS,
  ...NIST_CSF_REQUIREMENTS,
  ...HIPAA_REQUIREMENTS,
];

// ── Seed function ─────────────────────────────────────────────────────────────

export async function seedFrameworkCatalog(executor: SqlExecutor): Promise<void> {
  for (const fw of FRAMEWORKS) {
    await executor.query(
      `insert into frameworks (id, slug, name, version, description, status)
       values ($1, $2, $3, $4, $5, 'active')
       on conflict (id) do nothing`,
      [fw.id, fw.slug, fw.name, fw.version, fw.description],
    );
  }

  for (const req of ALL_REQUIREMENTS) {
    await executor.query(
      `insert into framework_requirements (id, framework_id, code, title, domain)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [req.id, req.frameworkId, req.code, req.title, req.domain],
    );
  }
}

// ── Exported lookup helpers used by the activation handler ───────────────────

export function getFrameworkBySlug(slug: string): FrameworkSeed | undefined {
  return FRAMEWORKS.find((f) => f.slug === slug);
}

export function getRequirementsForFramework(frameworkId: string): RequirementSeed[] {
  return ALL_REQUIREMENTS.filter((r) => r.frameworkId === frameworkId);
}

export { FRAMEWORKS as FRAMEWORK_CATALOG };
