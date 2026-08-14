/** Sample help content used by the demo page. */
export const helpContent = {
  categories: [
    { id: 'getting-started', title: 'Getting started', icon: '🚀', description: 'Set up your workspace and learn the basics.' },
    { id: 'billing', title: 'Billing & plans', icon: '💳', description: 'Invoices, payment methods, and upgrades.' },
    { id: 'reports', title: 'Reports & exports', icon: '📊', description: 'Build reports and get your data out.' },
    { id: 'account', title: 'Account & security', icon: '🔐', description: 'Sign-in, passwords, and team access.' },
  ],
  articles: [
    {
      id: 'quick-start',
      title: 'Quick start guide',
      category: 'getting-started',
      featured: true,
      tags: ['setup', 'onboarding'],
      updatedAt: '2026-07-02',
      body: `Welcome! Here is how to get productive in **five minutes**.

## 1. Create your first project

Click **New project** in the sidebar, give it a name, and pick a template.

## 2. Invite your team

Go to *Settings → Members* and enter email addresses. Teammates get an invite link that is valid for 7 days.

## 3. Connect a data source

We support:

- CSV upload
- PostgreSQL and MySQL
- REST APIs with \`Bearer\` auth

> Tip: you can re-open this help panel anytime with the **F1** key.`,
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard shortcuts',
      category: 'getting-started',
      featured: true,
      tags: ['productivity', 'shortcuts'],
      updatedAt: '2026-06-18',
      body: `Work faster with these shortcuts:

- \`Ctrl+K\` — command palette
- \`Ctrl+/\` — toggle sidebar
- \`F1\` — open this help panel
- \`G then D\` — go to dashboard

---

Shortcuts can be remapped under *Settings → Keyboard*.`,
    },
    {
      id: 'workspace-concepts',
      title: 'Workspaces, projects, and views',
      category: 'getting-started',
      tags: ['concepts'],
      updatedAt: '2026-05-30',
      body: `A **workspace** is your company's top-level container. It holds **projects**, and each project contains **views**.

1. Workspace — billing and members live here
2. Project — a unit of work with its own data sources
3. View — a saved configuration of filters and charts

See the [quick start guide](#quick-start-link) for a hands-on tour.`,
      related: ['quick-start'],
    },
    {
      id: 'understanding-invoices',
      title: 'Understanding your invoice',
      category: 'billing',
      featured: true,
      tags: ['billing', 'invoice', 'pdf'],
      updatedAt: '2026-07-21',
      body: `Your invoice lists all charges for the billing period.

## Where to find invoices

Go to *Settings → Billing → Invoices*. Each invoice can be downloaded as a **PDF**.

## Common line items

- **Seats** — one charge per active member
- **Usage** — metered API calls above the included quota
- **Credits** — negative line items from referrals or downgrades

> Invoices are finalized on the 1st of each month, and payment is collected 3 days later.`,
      related: ['change-plan', 'payment-methods'],
    },
    {
      id: 'change-plan',
      title: 'Upgrading or downgrading your plan',
      category: 'billing',
      tags: ['billing', 'plans'],
      updatedAt: '2026-04-11',
      body: `You can change plans anytime from *Settings → Billing → Plan*.

- **Upgrades** apply immediately; you are charged a prorated amount.
- **Downgrades** apply at the end of the current billing period.

Annual plans save **20%** compared to monthly billing.`,
    },
    {
      id: 'payment-methods',
      title: 'Managing payment methods',
      category: 'billing',
      tags: ['billing', 'cards'],
      updatedAt: '2026-03-08',
      body: `We accept credit cards and, on annual plans, bank transfer.

To update your card, open *Settings → Billing → Payment method* and click **Replace card**. The old card is removed after the new one is verified.`,
    },
    {
      id: 'build-report',
      title: 'Building your first report',
      category: 'reports',
      tags: ['reports', 'charts'],
      updatedAt: '2026-06-02',
      body: `Reports combine one or more views into a shareable page.

1. Open a project and click **New report**
2. Drag views onto the canvas
3. Click **Share** and choose *Anyone with the link* or *Members only*

Reports refresh their data every **15 minutes** on the free plan and every minute on paid plans.`,
    },
    {
      id: 'export-data',
      title: 'Exporting your data',
      category: 'reports',
      featured: true,
      tags: ['export', 'csv', 'pdf'],
      updatedAt: '2026-07-29',
      body: `You can export any report or raw dataset.

## Formats

- **CSV** — raw rows, best for spreadsheets
- **PDF** — pixel-perfect report snapshots
- **JSON** — via the API: \`GET /v1/exports\`

## Scheduled exports

Paid plans can schedule a nightly export to S3 or Google Cloud Storage:

\`\`\`json
{
  "schedule": "0 2 * * *",
  "format": "csv",
  "destination": "s3://my-bucket/exports"
}
\`\`\``,
      related: ['build-report'],
    },
    {
      id: 'reset-password',
      title: 'Resetting your password',
      category: 'account',
      tags: ['security', 'password', 'sign-in'],
      updatedAt: '2026-02-14',
      body: `Click **Forgot password?** on the sign-in screen and enter your email. A reset link arrives within a minute and is valid for **1 hour**.

If the email never arrives:

- Check your spam folder
- Confirm you signed up with that address
- Ask a workspace admin to trigger a reset from *Members*`,
    },
    {
      id: 'two-factor',
      title: 'Enabling two-factor authentication',
      category: 'account',
      tags: ['security', '2fa'],
      updatedAt: '2026-05-19',
      body: `We strongly recommend enabling 2FA for every member.

1. Open *Settings → Security*
2. Click **Enable two-factor auth**
3. Scan the QR code with an authenticator app
4. Store the recovery codes somewhere safe

> Workspace admins can *require* 2FA for all members under *Settings → Security policy*.`,
      related: ['reset-password'],
    },
    {
      id: 'sso-saml',
      title: 'Single sign-on (SAML)',
      category: 'account',
      tags: ['security', 'sso', 'enterprise'],
      updatedAt: '2026-07-07',
      body: `Enterprise plans support SAML SSO with Okta, Entra ID, and Google Workspace.

Configuration lives under *Settings → Security → SSO*. You will need:

- The IdP metadata URL
- An attribute mapping for \`email\`
- A signed certificate from your identity provider

After enabling SSO you can enforce it, which disables password sign-in for everyone except break-glass admins.`,
    },
  ],
};
