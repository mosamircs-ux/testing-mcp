'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Shield,
  Tag,
  Copy,
  Plus,
  Play,
  Share2,
  FileCheck,
  Zap,
  SlidersHorizontal,
  BarChart3,
  Check,
  AlertTriangle,
  FolderGit2
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Authentication: 'bg-cyan-950 text-cyan-400 border-cyan-800',
  Authorization: 'bg-purple-950 text-purple-400 border-purple-800',
  E2E: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  API: 'bg-blue-950 text-blue-400 border-blue-800',
  Functional: 'bg-teal-950 text-teal-400 border-teal-800',
  Negative: 'bg-rose-950 text-rose-400 border-rose-800',
  'Edge Cases': 'bg-amber-950 text-amber-400 border-amber-800',
  Validation: 'bg-orange-950 text-orange-400 border-orange-800',
  'Business Logic': 'bg-indigo-950 text-indigo-400 border-indigo-800',
  'Data Integrity': 'bg-yellow-950 text-yellow-400 border-yellow-800',
  'Performance boundaries': 'bg-sky-950 text-sky-400 border-sky-800',
  Accessibility: 'bg-pink-950 text-pink-400 border-pink-800',
  Responsive: 'bg-lime-950 text-lime-400 border-lime-800',
  UI: 'bg-slate-800 text-slate-300 border-slate-700',
  Regression: 'bg-violet-950 text-violet-400 border-violet-800',
  Integration: 'bg-fuchsia-950 text-fuchsia-400 border-fuchsia-800',
  'Security-oriented functional checks': 'bg-red-950 text-red-400 border-red-800'
};

const INITIAL_TEST_CASES = [
  {
    id: 'c-1',
    customId: 'TC001',
    title: 'Login with valid credentials',
    description: 'Verify user can authenticate successfully using valid email and password, receives JWT token, and redirects to dashboard.',
    priority: 'CRITICAL',
    category: 'Authentication',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Registered user exists in database', 'User email is verified'],
    testData: { email: 'alice@acme.com', password: 'Password123!' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/login', description: 'Open Login page' },
      { order: 2, action: 'TYPE', target: 'input[type="email"]', value: 'alice@acme.com', description: 'Enter valid email' },
      { order: 3, action: 'TYPE', target: 'input[type="password"]', value: 'Password123!', description: 'Enter valid password' },
      { order: 4, action: 'CLICK', target: 'button[type="submit"]', description: 'Click Sign In' },
      { order: 5, action: 'ASSERT', target: 'url', value: '/dashboard', description: 'Assert redirect to dashboard', expectedOutput: '/dashboard' }
    ],
    expectedResults: 'User is authenticated, session cookie/JWT is stored, and dashboard metrics render.',
    risk: 'Critical authentication failure blocks entire user base.',
    requirementReference: 'PRD-AUTH-001: User Login',
    affectedRoutes: ['/login', '/dashboard'],
    affectedApis: ['POST /api/v1/auth/login'],
    roles: ['OWNER', 'ADMIN', 'QA_ENGINEER', 'DEVELOPER', 'VIEWER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['auth', 'smoke', 'p0'],
    groupName: 'Authentication & Session'
  },
  {
    id: 'c-2',
    customId: 'TC002',
    title: 'Login with invalid password',
    description: 'Verify login fails with clear error alert when wrong password is supplied and rate limiter increments.',
    priority: 'HIGH',
    category: 'Negative',
    scenarioType: 'NEGATIVE_PATH',
    preconditions: ['Registered user exists in database'],
    testData: { email: 'alice@acme.com', password: 'WrongPassword999!' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/login', description: 'Open Login page' },
      { order: 2, action: 'TYPE', target: 'input[type="email"]', value: 'alice@acme.com', description: 'Enter valid email' },
      { order: 3, action: 'TYPE', target: 'input[type="password"]', value: 'WrongPassword999!', description: 'Enter invalid password' },
      { order: 4, action: 'CLICK', target: 'button[type="submit"]', description: 'Click Sign In' },
      { order: 5, action: 'ASSERT', target: '.error-banner', description: 'Assert 401 Invalid email or password alert displayed', expectedOutput: 'Invalid email or password' }
    ],
    expectedResults: 'Authentication is rejected with HTTP 401 and descriptive error banner.',
    risk: 'Broken credential validation causes security bypass.',
    requirementReference: 'PRD-AUTH-002: Credential Validation',
    affectedRoutes: ['/login'],
    affectedApis: ['POST /api/v1/auth/login'],
    roles: ['UNAUTHENTICATED'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['auth', 'negative', 'security'],
    groupName: 'Authentication & Session'
  },
  {
    id: 'c-3',
    customId: 'TC003',
    title: 'Password reset lifecycle',
    description: 'Verify forgot password flow sends reset token and allows updating password securely.',
    priority: 'HIGH',
    category: 'Functional',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['User account exists'],
    testData: { email: 'alice@acme.com', newPassword: 'BrandNewPassword123!' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/forgot-password', description: 'Open Forgot Password page' },
      { order: 2, action: 'TYPE', target: 'input[type="email"]', value: 'alice@acme.com', description: 'Submit reset email' },
      { order: 3, action: 'CLICK', target: 'button[type="submit"]', description: 'Dispatch reset request' },
      { order: 4, action: 'ASSERT', target: '.success-banner', description: 'Assert confirmation message displayed' }
    ],
    expectedResults: 'Reset token generated, hashed in DB with 1h expiration, and user can update credentials.',
    risk: 'Users locked out cannot regain account access.',
    requirementReference: 'PRD-AUTH-003: Password Recovery',
    affectedRoutes: ['/forgot-password', '/reset-password'],
    affectedApis: ['POST /api/v1/auth/forgot-password', 'POST /api/v1/auth/reset-password'],
    roles: ['OWNER', 'ADMIN', 'MEMBER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'PENDING',
    tags: ['auth', 'recovery'],
    groupName: 'Authentication & Session'
  },
  {
    id: 'c-4',
    customId: 'TC004',
    title: 'Unauthorized dashboard access prevention',
    description: 'Verify unauthenticated request to protected route (/dashboard) is blocked and redirected to /login.',
    priority: 'CRITICAL',
    category: 'Authorization',
    scenarioType: 'NEGATIVE_PATH',
    preconditions: ['Browser session has no JWT auth token'],
    testData: {},
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/dashboard', description: 'Navigate directly to /dashboard without cookies' },
      { order: 2, action: 'ASSERT', target: 'url', value: '/login', description: 'Assert redirect to /login' }
    ],
    expectedResults: 'User redirected to /login with 401 Unauthorized protection.',
    risk: 'IDOR / Auth bypass exposing sensitive metrics.',
    requirementReference: 'PRD-SEC-001: Route Guards',
    affectedRoutes: ['/dashboard', '/login'],
    affectedApis: [],
    roles: ['UNAUTHENTICATED'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['security', 'rbac', 'negative'],
    groupName: 'Access Control & Security'
  },
  {
    id: 'c-5',
    customId: 'TC005',
    title: 'Admin CRUD workflow on Project creation',
    description: 'Verify Admin/Owner can create, list, edit, and delete projects with tenant isolation.',
    priority: 'HIGH',
    category: 'Business Logic',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['User has OWNER or ADMIN role in active organization'],
    testData: { projectName: 'Autonomous Test Project', category: 'WEB', baseUrl: 'http://localhost:3000' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/projects/new', description: 'Open Project Onboarding wizard' },
      { order: 2, action: 'TYPE', target: 'input[name="name"]', value: 'Autonomous Test Project', description: 'Enter project name' },
      { order: 3, action: 'CLICK', target: 'button[type="submit"]', description: 'Save and submit project' },
      { order: 4, action: 'ASSERT', target: '.project-title', value: 'Autonomous Test Project', description: 'Assert project created in tenant' }
    ],
    expectedResults: 'Project created with default environment and partitioned under current organizationId.',
    risk: 'Core platform CRUD broken prevents creating test workspaces.',
    requirementReference: 'PRD-PROJ-001: Project Management',
    affectedRoutes: ['/projects', '/projects/new', '/projects/:id/overview'],
    affectedApis: ['POST /api/v1/projects', 'GET /api/v1/projects'],
    roles: ['OWNER', 'ADMIN'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['crud', 'e2e', 'happy-path'],
    groupName: 'Project Management'
  },
  {
    id: 'c-6',
    customId: 'TC006',
    title: 'Form validation on empty inputs',
    description: 'Verify submission with blank required fields triggers immediate inline client and server validation errors.',
    priority: 'MEDIUM',
    category: 'Validation',
    scenarioType: 'NEGATIVE_PATH',
    preconditions: ['Onboarding form open'],
    testData: { name: '', email: 'invalid-email-format' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/register', description: 'Open Register form' },
      { order: 2, action: 'CLICK', target: 'button[type="submit"]', description: 'Submit with empty fields' },
      { order: 3, action: 'ASSERT', target: ':invalid', description: 'Assert HTML5 or Zod validation errors displayed' }
    ],
    expectedResults: 'Form submission is halted and invalid input fields are visually highlighted.',
    risk: 'Bad data injected into database.',
    requirementReference: 'PRD-VAL-001: Client Input Validation',
    affectedRoutes: ['/register', '/login'],
    affectedApis: ['POST /api/v1/auth/register'],
    roles: ['UNAUTHENTICATED'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'PENDING',
    tags: ['validation', 'form', 'negative'],
    groupName: 'Validation & Input Boundaries'
  },
  {
    id: 'c-7',
    customId: 'TC007',
    title: 'API authentication with Bearer token',
    description: 'Verify REST endpoints accept valid Bearer JWT and extract tenant context correctly.',
    priority: 'CRITICAL',
    category: 'API',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Valid JWT access token issued'],
    testData: { header: 'Authorization: Bearer <valid_jwt>' },
    steps: [
      { order: 1, action: 'REQUEST', target: 'GET /api/v1/projects', description: 'Send authenticated GET request' },
      { order: 2, action: 'ASSERT', target: 'status', value: '200', description: 'Assert 200 OK and JSON project list returned' }
    ],
    expectedResults: 'HTTP 200 returned with tenant-isolated payload.',
    risk: 'API authentication regression blocks CI/CD and MCP tools.',
    requirementReference: 'PRD-API-001: REST API Auth',
    affectedRoutes: [],
    affectedApis: ['GET /api/v1/projects', 'GET /api/v1/runs'],
    roles: ['OWNER', 'ADMIN', 'QA_ENGINEER', 'DEVELOPER', 'VIEWER'],
    environment: 'STAGING',
    automationStatus: 'AUTOMATED',
    reviewStatus: 'APPROVED',
    tags: ['api', 'jwt', 'contract'],
    groupName: 'API & Contract Testing'
  },
  {
    id: 'c-8',
    customId: 'TC008',
    title: 'API authorization boundary check (Viewer role)',
    description: 'Verify Viewer role receives HTTP 403 Forbidden when attempting to trigger a test run or delete a project.',
    priority: 'HIGH',
    category: 'Authorization',
    scenarioType: 'NEGATIVE_PATH',
    preconditions: ['User authenticated with VIEWER role token'],
    testData: {},
    steps: [
      { order: 1, action: 'REQUEST', target: 'POST /api/v1/runs', description: 'Attempt test run trigger with Viewer credentials' },
      { order: 2, action: 'ASSERT', target: 'status', value: '403', description: 'Assert HTTP 403 Forbidden returned' }
    ],
    expectedResults: 'HTTP 403 Forbidden with message "Role VIEWER lacks run.execute permission".',
    risk: 'Privilege escalation allowing unauthorized test execution.',
    requirementReference: 'PRD-RBAC-002: Role Boundary Guard',
    affectedRoutes: [],
    affectedApis: ['POST /api/v1/runs', 'DELETE /api/v1/projects/:id'],
    roles: ['VIEWER'],
    environment: 'STAGING',
    automationStatus: 'AUTOMATED',
    reviewStatus: 'APPROVED',
    tags: ['security', 'rbac', 'api', 'negative'],
    groupName: 'Access Control & Security'
  },
  {
    id: 'c-9',
    customId: 'TC009',
    title: 'Pagination on large test run telemetry list',
    description: 'Verify test runs table handles 50+ runs with pagination controls, page size switches, and fast query execution.',
    priority: 'MEDIUM',
    category: 'Integration',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['More than 10 test runs exist in database'],
    testData: { page: 1, limit: 10 },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/dashboard', description: 'Open dashboard test runs table' },
      { order: 2, action: 'CLICK', target: 'button[data-testid="pagination-next"]', description: 'Click Next Page' },
      { order: 3, action: 'ASSERT', target: '.run-row', description: 'Assert page 2 rows rendered' }
    ],
    expectedResults: 'Page 2 items render without UI flicker or data duplication.',
    risk: 'Query performance degradation on large datasets.',
    requirementReference: 'PRD-UI-004: Data Tables & Pagination',
    affectedRoutes: ['/dashboard', '/runs'],
    affectedApis: ['GET /api/v1/runs'],
    roles: ['OWNER', 'ADMIN', 'QA_ENGINEER', 'DEVELOPER', 'VIEWER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'PENDING',
    tags: ['ui', 'pagination'],
    groupName: 'User Interface & Navigation'
  },
  {
    id: 'c-10',
    customId: 'TC010',
    title: 'Search filtering by project name and tags',
    description: 'Verify instant search bar filters projects and findings matching query string.',
    priority: 'MEDIUM',
    category: 'UI',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Multiple projects exist'],
    testData: { query: 'Storefront' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/projects', description: 'Open Projects page' },
      { order: 2, action: 'TYPE', target: 'input[placeholder*="Search"]', value: 'Storefront', description: 'Type search query' },
      { order: 3, action: 'ASSERT', target: '.project-card', description: 'Assert only matching projects visible' }
    ],
    expectedResults: 'Non-matching items are dynamically filtered out.',
    risk: 'Broken search impedes navigation in large multi-project workspaces.',
    requirementReference: 'PRD-UI-005: Real-Time Search',
    affectedRoutes: ['/projects', '/findings'],
    affectedApis: [],
    roles: ['MEMBER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['ui', 'search'],
    groupName: 'User Interface & Navigation'
  },
  {
    id: 'c-11',
    customId: 'TC011',
    title: 'Multi-criteria filtering on AI findings',
    description: 'Verify findings table correctly filters by CRITICAL severity and OPEN status.',
    priority: 'HIGH',
    category: 'Functional',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Findings exist in database'],
    testData: { severity: 'CRITICAL', status: 'OPEN' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/findings', description: 'Open Findings page' },
      { order: 2, action: 'CLICK', target: 'button[data-filter="CRITICAL"]', description: 'Filter by Critical severity' },
      { order: 3, action: 'ASSERT', target: '.finding-card', description: 'Assert only critical severity items rendered' }
    ],
    expectedResults: 'Findings list filtered accurately by compound criteria.',
    risk: 'Engineers miss critical triage defects.',
    requirementReference: 'PRD-TRIAGE-002: Finding Filters',
    affectedRoutes: ['/findings'],
    affectedApis: ['GET /api/v1/findings?severity=CRITICAL&status=OPEN'],
    roles: ['QA_ENGINEER', 'ADMIN', 'DEVELOPER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['triage', 'filters'],
    groupName: 'AI Triage & Telemetry'
  },
  {
    id: 'c-12',
    customId: 'TC012',
    title: 'Export test run summary (JUnit XML and Markdown)',
    description: 'Verify test run results export as valid standard JUnit XML and Markdown for CI/CD integration.',
    priority: 'HIGH',
    category: 'Integration',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Completed test run exists'],
    testData: { format: 'junit.xml' },
    steps: [
      { order: 1, action: 'REQUEST', target: 'GET /api/v1/runs/:id/report/junit.xml', description: 'Request JUnit XML report' },
      { order: 2, action: 'ASSERT', target: 'content-type', value: 'application/xml', description: 'Assert XML response header' },
      { order: 3, action: 'ASSERT', target: 'body', description: 'Assert <testsuites> and <testcase> tags present' }
    ],
    expectedResults: 'Properly formatted JUnit XML emitted conforming to CI reporting specs.',
    risk: 'CI/CD pipeline breaks if report schema is invalid.',
    requirementReference: 'PRD-REPORT-001: Standardized Reporting',
    affectedRoutes: ['/runs/:id'],
    affectedApis: ['GET /api/v1/runs/:id/report/junit.xml', 'GET /api/v1/runs/:id/report/summary.md'],
    roles: ['QA_ENGINEER', 'ADMIN', 'DEVELOPER'],
    environment: 'STAGING',
    automationStatus: 'AUTOMATED',
    reviewStatus: 'APPROVED',
    tags: ['reporting', 'junit', 'cicd'],
    groupName: 'Reporting & Exports'
  },
  {
    id: 'c-13',
    customId: 'TC013',
    title: 'E-Commerce End-to-End Shopping Cart & Checkout',
    description: 'Verify full user checkout journey: browse item, add to cart, apply coupon code, enter shipping, and place order.',
    priority: 'CRITICAL',
    category: 'E2E',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Product in stock', 'Valid promo coupon active in database'],
    testData: { product: 'Classic Cotton Tee', coupon: 'SAVE20' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/products/classic-tee', description: 'Open product page' },
      { order: 2, action: 'CLICK', target: 'button[data-testid="add-to-cart"]', description: 'Add item to cart' },
      { order: 3, action: 'NAVIGATE', target: '/checkout', description: 'Open Checkout' },
      { order: 4, action: 'TYPE', target: 'input[name="coupon"]', value: 'SAVE20', description: 'Apply discount coupon' },
      { order: 5, action: 'CLICK', target: 'button[data-testid="submit-order"]', description: 'Confirm and pay order' },
      { order: 6, action: 'ASSERT', target: '.order-success', description: 'Assert confirmation number displayed' }
    ],
    expectedResults: 'Order is created, discount applied, and inventory deducted.',
    risk: 'Revenue loss if checkout flow fails.',
    requirementReference: 'PRD-ECOMM-001: Core Checkout',
    affectedRoutes: ['/products/:slug', '/checkout', '/order/success'],
    affectedApis: ['POST /api/v1/cart', 'POST /api/v1/orders'],
    roles: ['CUSTOMER', 'MEMBER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['e2e', 'checkout', 'critical-path', 'p0'],
    groupName: 'Transactional Flows'
  },
  {
    id: 'c-14',
    customId: 'TC014',
    title: 'Payment gateway decline handling',
    description: 'Verify simulated credit card decline triggers user-friendly error message and leaves cart intact without charging.',
    priority: 'CRITICAL',
    category: 'Negative',
    scenarioType: 'NEGATIVE_PATH',
    preconditions: ['Items in checkout cart'],
    testData: { cardNumber: '4000000000000002', errorType: 'insufficient_funds' },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/checkout', description: 'Open Checkout' },
      { order: 2, action: 'TYPE', target: 'input[name="card"]', value: '4000000000000002', description: 'Enter test card that declines' },
      { order: 3, action: 'CLICK', target: 'button[data-testid="submit-order"]', description: 'Submit payment' },
      { order: 4, action: 'ASSERT', target: '.payment-error', description: 'Assert card declined warning banner displayed' }
    ],
    expectedResults: 'Payment declined warning displayed, order not confirmed, cart preserved.',
    risk: 'Incorrect state mutation on payment decline.',
    requirementReference: 'PRD-PAY-003: Payment Failure Handling',
    affectedRoutes: ['/checkout'],
    affectedApis: ['POST /api/v1/orders/charge'],
    roles: ['CUSTOMER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['payment', 'negative', 'edge-case'],
    groupName: 'Transactional Flows'
  },
  {
    id: 'c-15',
    customId: 'TC015',
    title: 'Session expiration and automatic token rotation',
    description: 'Verify expired access token uses refresh token automatically to rotate credentials without interrupting user.',
    priority: 'HIGH',
    category: 'Authentication',
    scenarioType: 'EDGE_CASE',
    preconditions: ['Active refresh token in session'],
    testData: {},
    steps: [
      { order: 1, action: 'REQUEST', target: 'POST /api/v1/auth/refresh', description: 'Trigger token refresh request' },
      { order: 2, action: 'ASSERT', target: 'status', value: '200', description: 'Assert new access token and rotated refresh token returned' }
    ],
    expectedResults: 'New token issued, old refresh token invalidated.',
    risk: 'Users prematurely logged out during active tasks.',
    requirementReference: 'PRD-AUTH-004: Session Rotation',
    affectedRoutes: ['/dashboard'],
    affectedApis: ['POST /api/v1/auth/refresh'],
    roles: ['MEMBER'],
    environment: 'STAGING',
    automationStatus: 'AUTOMATED',
    reviewStatus: 'APPROVED',
    tags: ['auth', 'session', 'rotation'],
    groupName: 'Authentication & Session'
  },
  {
    id: 'c-16',
    customId: 'TC016',
    title: 'Concurrent updates and optimistic concurrency control',
    description: 'Verify concurrent edits to the same project or suite record do not cause silent overwrites.',
    priority: 'HIGH',
    category: 'Data Integrity',
    scenarioType: 'EDGE_CASE',
    preconditions: ['Target project exists'],
    testData: { updateA: 'Name A', updateB: 'Name B' },
    steps: [
      { order: 1, action: 'REQUEST', target: 'PATCH /api/v1/projects/:id', value: 'Name A', description: 'User A updates project' },
      { order: 2, action: 'REQUEST', target: 'PATCH /api/v1/projects/:id', value: 'Name B', description: 'User B updates project simultaneously' },
      { order: 3, action: 'ASSERT', target: 'status', description: 'Assert atomic persistence in DB' }
    ],
    expectedResults: 'Database updates are serialized cleanly without data corruption.',
    risk: 'Data loss when team members work concurrently.',
    requirementReference: 'PRD-DATA-002: Concurrency Guards',
    affectedRoutes: ['/projects/:id'],
    affectedApis: ['PATCH /api/v1/projects/:id'],
    roles: ['ADMIN', 'OWNER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['concurrency', 'data-integrity', 'edge-case'],
    groupName: 'Data Integrity & Edge Cases'
  },
  {
    id: 'c-17',
    customId: 'TC017',
    title: 'Empty state illustration on newly created project',
    description: 'Verify fresh workspace with 0 test runs displays inviting empty state and quick action CTA buttons.',
    priority: 'LOW',
    category: 'UI',
    scenarioType: 'EDGE_CASE',
    preconditions: ['New project with 0 test runs'],
    testData: {},
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/dashboard', description: 'Open dashboard of new project' },
      { order: 2, action: 'ASSERT', target: '.empty-state', description: 'Assert empty state graphic and "Run Suite" button visible' }
    ],
    expectedResults: 'Clean empty state rendered without throwing null pointer exceptions.',
    risk: 'Poor first-time user experience.',
    requirementReference: 'PRD-UI-007: Empty State Handling',
    affectedRoutes: ['/dashboard', '/findings'],
    affectedApis: [],
    roles: ['MEMBER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['ui', 'empty-state'],
    groupName: 'User Interface & Navigation'
  },
  {
    id: 'c-18',
    customId: 'TC018',
    title: 'Network timeout and offline resilience',
    description: 'Verify client application displays retry toast and preserves form inputs when network drops.',
    priority: 'MEDIUM',
    category: 'Performance boundaries',
    scenarioType: 'EDGE_CASE',
    preconditions: ['Network connection simulated offline'],
    testData: {},
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/projects/new', description: 'Fill onboarding form' },
      { order: 2, action: 'CLICK', target: 'button[type="submit"]', description: 'Submit with simulated network timeout' },
      { order: 3, action: 'ASSERT', target: '.toast-error', description: 'Assert retry toast notification displayed' }
    ],
    expectedResults: 'Client notifies user of network issue and allows retrying without re-entering form data.',
    risk: 'Data loss on unstable network connections.',
    requirementReference: 'PRD-NET-001: Network Fault Tolerance',
    affectedRoutes: ['/projects/new'],
    affectedApis: ['POST /api/v1/projects/onboarding'],
    roles: ['MEMBER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['network', 'offline', 'resilience'],
    groupName: 'Performance & Boundary Tests'
  },
  {
    id: 'c-19',
    customId: 'TC019',
    title: 'Mobile responsive layout on iPhone/Android viewports',
    description: 'Verify navigation bar collapses to mobile hamburger drawer and tables enable horizontal scroll on 375px viewport.',
    priority: 'MEDIUM',
    category: 'Responsive',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Viewport set to 375x812 (iPhone 13)'],
    testData: { width: 375, height: 812 },
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/dashboard', description: 'Open dashboard in mobile viewport' },
      { order: 2, action: 'ASSERT', target: 'button[aria-label="menu"]', description: 'Assert hamburger toggle visible' },
      { order: 3, action: 'CLICK', target: 'button[aria-label="menu"]', description: 'Open drawer menu' },
      { order: 4, action: 'ASSERT', target: '.mobile-nav', description: 'Assert drawer navigation links rendered' }
    ],
    expectedResults: 'Mobile view renders cleanly without overlapping text or clipped action buttons.',
    risk: 'Mobile users cannot access core platform controls.',
    requirementReference: 'PRD-RESP-001: Mobile Layouts',
    affectedRoutes: ['/dashboard', '/projects', '/settings/*'],
    affectedApis: [],
    roles: ['MEMBER'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['responsive', 'mobile', 'ui'],
    groupName: 'User Interface & Navigation'
  },
  {
    id: 'c-20',
    customId: 'TC020',
    title: 'Accessibility keyboard navigation and ARIA landmarks',
    description: 'Verify entire authentication and checkout journey is fully operable via Tab, Enter, and Space keys with visible focus rings.',
    priority: 'HIGH',
    category: 'Accessibility',
    scenarioType: 'HAPPY_PATH',
    preconditions: ['Keyboard only navigation simulated'],
    testData: {},
    steps: [
      { order: 1, action: 'NAVIGATE', target: '/login', description: 'Open Login page' },
      { order: 2, action: 'TYPE', target: 'body', value: 'Tab', description: 'Tab to first input' },
      { order: 3, action: 'ASSERT', target: ':focus', description: 'Assert visible focus indicator on active element' },
      { order: 4, action: 'ASSERT', target: '[aria-label], label', description: 'Assert all inputs have associated accessible labels' }
    ],
    expectedResults: 'WCAG 2.1 AA compliance: all interactive elements reachable via keyboard with visible focus.',
    risk: 'Accessibility compliance violations.',
    requirementReference: 'PRD-A11Y-001: WCAG 2.1 AA Keyboard Access',
    affectedRoutes: ['/login', '/checkout', '/dashboard'],
    affectedApis: [],
    roles: ['ALL'],
    environment: 'STAGING',
    automationStatus: 'READY_FOR_AUTOMATION',
    reviewStatus: 'APPROVED',
    tags: ['a11y', 'wcag', 'keyboard'],
    groupName: 'Accessibility & Compliance'
  }
];

export default function TestPlanningPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [testCases, setTestCases] = useState(INITIAL_TEST_CASES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>('c-1');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [scenarioFilter, setScenarioFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Coverage Metrics Calculation
  const totalCount = testCases.length;
  const happyCount = testCases.filter((t) => t.scenarioType === 'HAPPY_PATH').length;
  const negCount = testCases.filter((t) => t.scenarioType === 'NEGATIVE_PATH').length;
  const edgeCount = testCases.filter((t) => t.scenarioType === 'EDGE_CASE').length;
  const approvedCount = testCases.filter((t) => t.reviewStatus === 'APPROVED').length;

  const coverage = {
    requirements: 96,
    routes: 100,
    apis: 100,
    features: 100,
    roles: 100,
    negativePath: totalCount > 0 ? Math.round(((negCount + edgeCount) / totalCount) * 100) : 0
  };

  const filteredCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.customId.toLowerCase().includes(search.toLowerCase()) ||
      tc.title.toLowerCase().includes(search.toLowerCase()) ||
      tc.description.toLowerCase().includes(search.toLowerCase()) ||
      tc.requirementReference.toLowerCase().includes(search.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || tc.category === categoryFilter;
    const matchesPri = priorityFilter === 'ALL' || tc.priority === priorityFilter;
    const matchesScen = scenarioFilter === 'ALL' || tc.scenarioType === scenarioFilter;
    const matchesStat = statusFilter === 'ALL' || tc.reviewStatus === statusFilter;

    return matchesSearch && matchesCat && matchesPri && matchesScen && matchesStat;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCases.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApprove = () => {
    setTestCases(
      testCases.map((c) => (selectedIds.includes(c.id) ? { ...c, reviewStatus: 'APPROVED' } : c))
    );
    setStatusMsg(`Approved ${selectedIds.length} test cases.`);
    setSelectedIds([]);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleBulkReject = () => {
    setTestCases(
      testCases.map((c) => (selectedIds.includes(c.id) ? { ...c, reviewStatus: 'REJECTED' } : c))
    );
    setStatusMsg(`Rejected ${selectedIds.length} test cases.`);
    setSelectedIds([]);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExportToSuite = () => {
    setStatusMsg(`Exported ${approvedCount} approved test cases to Executable TestSuite without deleting existing suites.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowGenerateModal(false);
      setStatusMsg('Autonomous AI Test Planning Engine synthesized 20 comprehensive scenarios.');
      setTimeout(() => setStatusMsg(null), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Autonomous Test Planning Engine
            </span>
            <span className="text-xs text-slate-500 font-mono">20 Synthesized Scenarios • Deduplication Active</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Master Autonomous Test Plan</h1>
          <p className="text-xs text-slate-400 mt-1">
            Traceable test scenarios generated from PRD, Discovery Maps, API Specs, and Codebase heuristics.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 flex items-center gap-1.5 transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            AI Generator Instructions
          </button>

          <button
            onClick={handleExportToSuite}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow flex items-center gap-2 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-slate-950" />
            Export to Executable Suite ({approvedCount})
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Coverage Metrics Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            Autonomous Coverage Metrics
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {happyCount} Happy Path • {negCount} Negative • {edgeCount} Edge Cases
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Requirements', value: coverage.requirements },
            { label: 'Route Coverage', value: coverage.routes },
            { label: 'API Coverage', value: coverage.apis },
            { label: 'Feature Modules', value: coverage.features },
            { label: 'Role Matrices', value: coverage.roles },
            { label: 'Negative-Path', value: coverage.negativePath }
          ].map((m, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{m.label}</span>
                <span className="font-mono font-bold text-cyan-400">{m.value}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-accent-500 h-full rounded-full"
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Bulk Operations Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search TC ID, title, or PRD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-300"
          >
            <option value="ALL">All Categories (19)</option>
            <option value="Authentication">Authentication</option>
            <option value="Authorization">Authorization</option>
            <option value="E2E">E2E</option>
            <option value="API">API</option>
            <option value="Negative">Negative</option>
            <option value="Edge Cases">Edge Cases</option>
            <option value="Validation">Validation</option>
            <option value="Business Logic">Business Logic</option>
            <option value="Data Integrity">Data Integrity</option>
            <option value="Accessibility">Accessibility</option>
            <option value="Responsive">Responsive</option>
            <option value="Performance boundaries">Performance boundaries</option>
          </select>

          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-300"
          >
            <option value="ALL">All Scenarios</option>
            <option value="HAPPY_PATH">Happy Path</option>
            <option value="NEGATIVE_PATH">Negative Path</option>
            <option value="EDGE_CASE">Edge Case</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-300"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <span className="text-xs text-slate-400 font-mono">{selectedIds.length} Selected:</span>
            <button
              onClick={handleBulkApprove}
              className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold hover:bg-emerald-900 flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Bulk Approve
            </button>
            <button
              onClick={handleBulkReject}
              className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-semibold hover:bg-rose-900 flex items-center gap-1"
            >
              <XCircle className="h-3 w-3" /> Bulk Reject
            </button>
          </div>
        )}
      </div>

      {/* Test Cases List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
        <div className="px-6 py-3 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredCases.length && filteredCases.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-cyan-500"
            />
            <span>Test Scenario Details ({filteredCases.length})</span>
          </div>
          <span>Priority & Traceability</span>
        </div>

        {filteredCases.map((tc) => {
          const isExpanded = expandedId === tc.id;
          const isSelected = selectedIds.includes(tc.id);
          const catColor = CATEGORY_COLORS[tc.category] || 'bg-slate-800 text-slate-300 border-slate-700';

          return (
            <div key={tc.id} className="p-5 hover:bg-slate-900/30 transition-colors space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(tc.id)}
                    className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-cyan-500 mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800">
                        {tc.customId}
                      </span>
                      <h3 className="text-sm font-bold text-white">{tc.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${catColor}`}>
                        {tc.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          tc.scenarioType === 'HAPPY_PATH'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : tc.scenarioType === 'NEGATIVE_PATH'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {tc.scenarioType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">{tc.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      tc.priority === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : tc.priority === 'HIGH'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {tc.priority}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      tc.reviewStatus === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : tc.reviewStatus === 'REJECTED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {tc.reviewStatus}
                  </span>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Traceability Reference Tag */}
              <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                <span className="flex items-center gap-1 text-cyan-400">
                  <FileCheck className="h-3 w-3" />
                  {tc.requirementReference}
                </span>
                {tc.affectedRoutes.length > 0 && (
                  <span>Routes: {tc.affectedRoutes.join(', ')}</span>
                )}
                {tc.affectedApis.length > 0 && (
                  <span>APIs: {tc.affectedApis.join(', ')}</span>
                )}
              </div>

              {/* Expandable Accordion: Steps, Preconditions, Expected Results */}
              {isExpanded && (
                <div className="pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <strong className="text-slate-300 font-semibold block">Preconditions:</strong>
                      <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                        {tc.preconditions.map((p, pI) => (
                          <li key={pI}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <strong className="text-slate-300 font-semibold block">Expected Result & Risk:</strong>
                      <p className="text-emerald-300 text-[11px]">✓ {tc.expectedResults}</p>
                      <p className="text-amber-400/90 text-[11px] pt-1">⚠️ Risk: {tc.risk}</p>
                    </div>
                  </div>

                  {/* Steps breakdown */}
                  <div className="space-y-2">
                    <strong className="text-slate-300 font-semibold block">Structured Execution Steps:</strong>
                    <div className="space-y-1.5">
                      {tc.steps.map((st) => (
                        <div
                          key={st.order}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-cyan-400 font-bold">Step {st.order}:</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                              {st.action}
                            </span>
                            <span className="text-slate-400">{st.description}</span>
                          </div>
                          <span className="text-slate-500">{st.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Test Plan Generator Drawer / Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              Configure AI Test Plan Generator
            </h3>
            <p className="text-xs text-slate-400">
              Provide custom guidance for the autonomous generator. It will merge your PRD, Discovery maps, and heuristics.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Custom Testing Instructions & Emphasis
                </label>
                <textarea
                  rows={4}
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  placeholder="e.g. Focus heavily on SQL injection boundary tests, promo code edge cases, and mobile responsive behavior..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 resize-none font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                <span>Semantic Deduplication & Multi-dimensional Coverage analysis will run automatically.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Synthesizing Test Plan...' : 'Generate Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
