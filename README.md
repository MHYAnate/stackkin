# stackkin
a central, accessible platform for sharing and leveraging proven solutions, cutting-edge services, and practical knowledge, thereby fostering innovation and driving the collective growth of every member

stackkin/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-backend.yml
│   │   └── deploy-frontend.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS                              # ← ADDED: Code ownership file
│
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.js
│   │   │   │   ├── redis.js
│   │   │   │   ├── cloudinary.js
│   │   │   │   ├── cors.js
│   │   │   │   ├── security.js
│   │   │   │   ├── socket.js
│   │   │   │   ├── logger.js                   # ← ADDED: Logger configuration
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── graphql/
│   │   │   │   ├── schema/
│   │   │   │   │   ├── typeDefs/
│   │   │   │   │   │   ├── user.typeDef.js
│   │   │   │   │   │   ├── solution.typeDef.js
│   │   │   │   │   │   ├── job.typeDef.js
│   │   │   │   │   │   ├── marketplace.typeDef.js
│   │   │   │   │   │   ├── chat.typeDef.js
│   │   │   │   │   │   ├── squad.typeDef.js
│   │   │   │   │   │   ├── subscription.typeDef.js
│   │   │   │   │   │   ├── payment.typeDef.js
│   │   │   │   │   │   ├── notification.typeDef.js
│   │   │   │   │   │   ├── advertisement.typeDef.js
│   │   │   │   │   │   ├── analytics.typeDef.js
│   │   │   │   │   │   ├── admin/
│   │   │   │   │   │   │   ├── superAdmin.typeDef.js
│   │   │   │   │   │   │   ├── userManagement.typeDef.js
│   │   │   │   │   │   │   ├── solutionManagement.typeDef.js
│   │   │   │   │   │   │   ├── jobManagement.typeDef.js
│   │   │   │   │   │   │   ├── marketplaceManagement.typeDef.js
│   │   │   │   │   │   │   ├── chatManagement.typeDef.js
│   │   │   │   │   │   │   ├── verificationManagement.typeDef.js
│   │   │   │   │   │   │   ├── subscriptionManagement.typeDef.js
│   │   │   │   │   │   │   ├── emailManagement.typeDef.js
│   │   │   │   │   │   │   ├── advertisingManagement.typeDef.js
│   │   │   │   │   │   │   ├── analyticsManagement.typeDef.js
│   │   │   │   │   │   │   ├── securityManagement.typeDef.js
│   │   │   │   │   │   │   └── index.js        # ← ADDED
│   │   │   │   │   │   └── index.js
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   ├── resolvers/                  # ← MOVED: Now sibling of schema/
│   │   │   │   │   ├── user.resolver.js
│   │   │   │   │   ├── solution.resolver.js
│   │   │   │   │   ├── job.resolver.js
│   │   │   │   │   ├── marketplace.resolver.js
│   │   │   │   │   ├── chat.resolver.js
│   │   │   │   │   ├── squad.resolver.js
│   │   │   │   │   ├── subscription.resolver.js
│   │   │   │   │   ├── payment.resolver.js
│   │   │   │   │   ├── notification.resolver.js
│   │   │   │   │   ├── advertisement.resolver.js
│   │   │   │   │   ├── analytics.resolver.js
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── superAdmin.resolver.js
│   │   │   │   │   │   ├── userManagement.resolver.js
│   │   │   │   │   │   ├── solutionManagement.resolver.js
│   │   │   │   │   │   ├── jobManagement.resolver.js
│   │   │   │   │   │   ├── marketplaceManagement.resolver.js
│   │   │   │   │   │   ├── chatManagement.resolver.js
│   │   │   │   │   │   ├── verificationManagement.resolver.js
│   │   │   │   │   │   ├── subscriptionManagement.resolver.js
│   │   │   │   │   │   ├── emailManagement.resolver.js
│   │   │   │   │   │   ├── advertisingManagement.resolver.js
│   │   │   │   │   │   ├── analyticsManagement.resolver.js
│   │   │   │   │   │   ├── securityManagement.resolver.js
│   │   │   │   │   │   └── index.js            # ← ADDED
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   ├── subscriptions/              # ← ADDED: GraphQL Subscriptions
│   │   │   │   │   ├── chat.subscription.js
│   │   │   │   │   ├── notification.subscription.js
│   │   │   │   │   ├── activity.subscription.js
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   ├── directives/
│   │   │   │   │   ├── auth.directive.js
│   │   │   │   │   ├── role.directive.js
│   │   │   │   │   ├── rateLimit.directive.js
│   │   │   │   │   ├── cacheControl.directive.js # ← ADDED
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   ├── scalars/
│   │   │   │   │   ├── dateTime.scalar.js
│   │   │   │   │   ├── upload.scalar.js
│   │   │   │   │   ├── json.scalar.js          # ← ADDED
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   ├── loaders/                    # ← ADDED: DataLoader implementations
│   │   │   │   │   ├── user.loader.js
│   │   │   │   │   ├── solution.loader.js
│   │   │   │   │   ├── squad.loader.js
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   ├── context.js
│   │   │   │   └── index.js                    # ← ADDED: Main GraphQL export
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── User.js
│   │   │   │   ├── Solution.js
│   │   │   │   ├── Job.js
│   │   │   │   ├── MarketplaceListing.js
│   │   │   │   ├── Chat.js
│   │   │   │   ├── Message.js
│   │   │   │   ├── Squad.js
│   │   │   │   ├── Subscription.js
│   │   │   │   ├── Payment.js
│   │   │   │   ├── Notification.js
│   │   │   │   ├── Advertisement.js
│   │   │   │   ├── AuditLog.js
│   │   │   │   ├── Rating.js
│   │   │   │   ├── Complaint.js
│   │   │   │   ├── Bounty.js
│   │   │   │   ├── Verification.js
│   │   │   │   ├── Session.js
│   │   │   │   ├── Achievement.js
│   │   │   │   ├── Announcement.js
│   │   │   │   ├── Category.js                 # ← ADDED
│   │   │   │   ├── Application.js              # ← ADDED: Job applications
│   │   │   │   ├── Transaction.js              # ← ADDED: Payment transactions
│   │   │   │   ├── VirtualAccount.js           # ← ADDED: Zainpay accounts
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.service.js
│   │   │   │   │   ├── token.service.js
│   │   │   │   │   ├── password.service.js
│   │   │   │   │   ├── session.service.js
│   │   │   │   │   ├── twoFactor.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── user/
│   │   │   │   │   ├── user.service.js
│   │   │   │   │   ├── profile.service.js
│   │   │   │   │   ├── verification.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── solution/
│   │   │   │   │   ├── solution.service.js
│   │   │   │   │   ├── rating.service.js
│   │   │   │   │   ├── complaint.service.js
│   │   │   │   │   ├── category.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── job/
│   │   │   │   │   ├── job.service.js
│   │   │   │   │   ├── application.service.js
│   │   │   │   │   ├── collaboration.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── marketplace/
│   │   │   │   │   ├── marketplace.service.js
│   │   │   │   │   ├── transaction.service.js
│   │   │   │   │   ├── bounty.service.js
│   │   │   │   │   ├── escrow.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── chat/
│   │   │   │   │   ├── chat.service.js
│   │   │   │   │   ├── message.service.js
│   │   │   │   │   ├── announcement.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── squad/
│   │   │   │   │   ├── squad.service.js
│   │   │   │   │   ├── squadApplication.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── subscription/
│   │   │   │   │   ├── subscription.service.js
│   │   │   │   │   ├── tier.service.js
│   │   │   │   │   ├── benefits.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── payment/
│   │   │   │   │   ├── payment.service.js
│   │   │   │   │   ├── zainpay.service.js
│   │   │   │   │   ├── webhook.service.js
│   │   │   │   │   ├── virtualAccount.service.js  # ← ADDED
│   │   │   │   │   ├── transfer.service.js        # ← ADDED
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── notification/
│   │   │   │   │   ├── notification.service.js
│   │   │   │   │   ├── email.service.js
│   │   │   │   │   ├── push.service.js
│   │   │   │   │   ├── sms.service.js          # ← ADDED
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── advertisement/
│   │   │   │   │   ├── advertisement.service.js
│   │   │   │   │   ├── campaign.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── analytics.service.js
│   │   │   │   │   ├── metrics.service.js
│   │   │   │   │   ├── reporting.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── gamification/
│   │   │   │   │   ├── achievement.service.js
│   │   │   │   │   ├── badge.service.js
│   │   │   │   │   ├── leaderboard.service.js
│   │   │   │   │   ├── streak.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── admin/
│   │   │   │   │   ├── superAdmin.service.js
│   │   │   │   │   ├── userManagement.service.js
│   │   │   │   │   ├── solutionManagement.service.js
│   │   │   │   │   ├── jobManagement.service.js
│   │   │   │   │   ├── marketplaceManagement.service.js
│   │   │   │   │   ├── chatManagement.service.js
│   │   │   │   │   ├── verificationManagement.service.js
│   │   │   │   │   ├── subscriptionManagement.service.js
│   │   │   │   │   ├── emailManagement.service.js
│   │   │   │   │   ├── advertisingManagement.service.js
│   │   │   │   │   ├── analyticsManagement.service.js
│   │   │   │   │   ├── securityManagement.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── file/
│   │   │   │   │   ├── upload.service.js
│   │   │   │   │   ├── cloudinary.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── cache/
│   │   │   │   │   ├── cache.service.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── search/                     # ← ADDED: Search service
│   │   │   │   │   ├── search.service.js
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js
│   │   │   │   ├── role.middleware.js
│   │   │   │   ├── rateLimiter.middleware.js
│   │   │   │   ├── validator.middleware.js
│   │   │   │   ├── errorHandler.middleware.js
│   │   │   │   ├── audit.middleware.js
│   │   │   │   ├── cors.middleware.js
│   │   │   │   ├── security.middleware.js
│   │   │   │   ├── upload.middleware.js
│   │   │   │   ├── compression.middleware.js   # ← ADDED
│   │   │   │   ├── requestLogger.middleware.js # ← ADDED
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── webhook.routes.js
│   │   │   │   ├── upload.routes.js
│   │   │   │   ├── health.routes.js
│   │   │   │   ├── auth.routes.js              # ← ADDED: REST auth fallback
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── socket/
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── chat.handler.js
│   │   │   │   │   ├── notification.handler.js
│   │   │   │   │   ├── presence.handler.js
│   │   │   │   │   ├── activity.handler.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── events/
│   │   │   │   │   ├── events.js
│   │   │   │   │   └── index.js                # ← ADDED
│   │   │   │   │
│   │   │   │   ├── middleware/                 # ← ADDED: Socket middleware
│   │   │   │   │   ├── auth.socket.js
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── crypto.util.js
│   │   │   │   ├── jwt.util.js
│   │   │   │   ├── hash.util.js
│   │   │   │   ├── validator.util.js
│   │   │   │   ├── sanitizer.util.js
│   │   │   │   ├── pagination.util.js
│   │   │   │   ├── date.util.js
│   │   │   │   ├── slug.util.js
│   │   │   │   ├── response.util.js
│   │   │   │   ├── error.util.js
│   │   │   │   ├── string.util.js              # ← ADDED
│   │   │   │   ├── file.util.js                # ← ADDED
│   │   │   │   ├── constants.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── errors/                         # ← ADDED: Custom error classes
│   │   │   │   ├── AppError.js
│   │   │   │   ├── ValidationError.js
│   │   │   │   ├── AuthenticationError.js
│   │   │   │   ├── AuthorizationError.js
│   │   │   │   ├── NotFoundError.js
│   │   │   │   ├── PaymentError.js
│   │   │   │   ├── RateLimitError.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── jobs/
│   │   │   │   ├── cleanup.job.js
│   │   │   │   ├── notification.job.js
│   │   │   │   ├── analytics.job.js
│   │   │   │   ├── subscription.job.js
│   │   │   │   ├── leaderboard.job.js          # ← ADDED
│   │   │   │   ├── email.job.js                # ← ADDED
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── user.validator.js
│   │   │   │   ├── solution.validator.js
│   │   │   │   ├── job.validator.js
│   │   │   │   ├── marketplace.validator.js
│   │   │   │   ├── chat.validator.js
│   │   │   │   ├── payment.validator.js
│   │   │   │   ├── squad.validator.js          # ← ADDED
│   │   │   │   ├── auth.validator.js           # ← ADDED
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── types/                          # ← ADDED: JSDoc type definitions
│   │   │   │   ├── user.types.js
│   │   │   │   ├── solution.types.js
│   │   │   │   ├── payment.types.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   │
│   │   ├── database/                           # ← ADDED: Database management
│   │   │   ├── seeds/
│   │   │   │   ├── users.seed.js
│   │   │   │   ├── categories.seed.js
│   │   │   │   ├── subscriptions.seed.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── migrations/
│   │   │   │   └── .gitkeep
│   │   │   │
│   │   │   └── index.js
│   │   │
│   │   ├── scripts/                            # ← ADDED: Backend-specific scripts
│   │   │   ├── seed.js
│   │   │   ├── migrate.js
│   │   │   ├── createAdmin.js
│   │   │   └── cleanup.js
│   │   │
│   │   ├── logs/                               # ← ADDED: Log files directory
│   │   │   └── .gitkeep
│   │   │
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   │   ├── services/
│   │   │   │   │   ├── auth.service.test.js
│   │   │   │   │   ├── user.service.test.js
│   │   │   │   │   ├── solution.service.test.js
│   │   │   │   │   ├── payment.service.test.js
│   │   │   │   │   └── zainpay.service.test.js # ← ADDED
│   │   │   │   │
│   │   │   │   ├── utils/
│   │   │   │   │   ├── crypto.util.test.js
│   │   │   │   │   ├── jwt.util.test.js
│   │   │   │   │   └── validator.util.test.js  # ← ADDED
│   │   │   │   │
│   │   │   │   └── models/                     # ← ADDED: Model tests
│   │   │   │       ├── User.test.js
│   │   │   │       └── Solution.test.js
│   │   │   │
│   │   │   ├── integration/
│   │   │   │   ├── auth.integration.test.js
│   │   │   │   ├── solution.integration.test.js
│   │   │   │   ├── payment.integration.test.js
│   │   │   │   └── graphql.integration.test.js # ← ADDED
│   │   │   │
│   │   │   ├── e2e/                            # ← ADDED: End-to-end tests
│   │   │   │   ├── user.e2e.test.js
│   │   │   │   ├── solution.e2e.test.js
│   │   │   │   └── payment.e2e.test.js
│   │   │   │
│   │   │   ├── fixtures/                       # ← ADDED: Test data
│   │   │   │   ├── users.fixture.js
│   │   │   │   ├── solutions.fixture.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── mocks/                          # ← ADDED: Mock implementations
│   │   │   │   ├── zainpay.mock.js
│   │   │   │   ├── cloudinary.mock.js
│   │   │   │   ├── redis.mock.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── helpers/                        # ← ADDED: Test helpers
│   │   │   │   ├── db.helper.js
│   │   │   │   ├── auth.helper.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── setup.js
│   │   │   ├── teardown.js                     # ← ADDED
│   │   │   └── jest.config.js                  # ← ADDED
│   │   │
│   │   ├── .env.example
│   │   ├── .env.test                           # ← ADDED: Test environment
│   │   ├── .eslintrc.json
│   │   ├── .prettierrc
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev                      # ← ADDED: Dev Dockerfile
│   │   ├── package.json
│   │   ├── railway.toml
│   │   ├── nodemon.json                        # ← ADDED: Nodemon config
│   │   └── README.md
│   │
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   ├── login/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── loading.tsx         # ← ADDED
│       │   │   │   ├── register/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── loading.tsx         # ← ADDED
│       │   │   │   ├── forgot-password/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── loading.tsx         # ← ADDED
│       │   │   │   ├── reset-password/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── loading.tsx         # ← ADDED
│       │   │   │   ├── verify-email/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── loading.tsx         # ← ADDED
│       │   │   │   ├── two-factor/             # ← ADDED: 2FA page
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── loading.tsx             # ← ADDED
│       │   │   │   └── error.tsx               # ← ADDED
│       │   │   │
│       │   │   ├── (main)/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── solutions/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── error.tsx           # ← ADDED
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   └── error.tsx       # ← ADDED
│       │   │   │   │   ├── create/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   ├── edit/               # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   └── category/
│       │   │   │   │       └── [slug]/
│       │   │   │   │           ├── page.tsx
│       │   │   │   │           └── loading.tsx # ← ADDED
│       │   │   │   │
│       │   │   │   ├── jobs/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── error.tsx           # ← ADDED
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── error.tsx       # ← ADDED
│       │   │   │   │   │   └── apply/          # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── create/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   ├── edit/               # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── collaborations/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   └── my-applications/    # ← ADDED
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── marketplace/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── error.tsx           # ← ADDED
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   └── error.tsx       # ← ADDED
│       │   │   │   │   ├── create/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   ├── edit/               # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── bounties/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── [id]/           # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── create/         # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   └── my-listings/        # ← ADDED
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── chat/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── error.tsx           # ← ADDED
│       │   │   │   │   ├── [roomId]/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   └── premium/
│       │   │   │   │       ├── page.tsx
│       │   │   │   │       └── loading.tsx     # ← ADDED
│       │   │   │   │
│       │   │   │   ├── squads/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── error.tsx           # ← ADDED
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── members/        # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── settings/       # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── create/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   └── my-squads/          # ← ADDED
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── talent-pool/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── error.tsx           # ← ADDED
│       │   │   │   │   └── [username]/         # ← ADDED
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── profile/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── error.tsx           # ← ADDED
│       │   │   │   │   ├── [username]/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   ├── settings/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── security/       # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── notifications/  # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── verification/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   ├── subscription/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   ├── achievements/       # ← ADDED
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── wallet/             # ← ADDED
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── notifications/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── loading.tsx         # ← ADDED
│       │   │   │   │
│       │   │   │   ├── leaderboard/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── loading.tsx         # ← ADDED
│       │   │   │   │
│       │   │   │   ├── knowledge-hub/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── [slug]/             # ← ADDED
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── search/             # ← ADDED
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── search/                 # ← ADDED: Global search
│       │   │   │   │   └── page.tsx
│       │   │   │   │
│       │   │   │   ├── payments/               # ← ADDED: Payment pages
│       │   │   │   │   ├── success/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── failed/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── history/
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── loading.tsx             # ← ADDED
│       │   │   │   └── error.tsx               # ← ADDED
│       │   │   │
│       │   │   ├── (admin)/
│       │   │   │   ├── admin/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── loading.tsx         # ← ADDED
│       │   │   │   │   ├── users/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       ├── page.tsx
│       │   │   │   │   │       └── loading.tsx # ← ADDED
│       │   │   │   │   │
│       │   │   │   │   ├── solutions/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       ├── page.tsx
│       │   │   │   │   │       └── loading.tsx # ← ADDED
│       │   │   │   │   │
│       │   │   │   │   ├── jobs/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       ├── page.tsx
│       │   │   │   │   │       └── loading.tsx # ← ADDED
│       │   │   │   │   │
│       │   │   │   │   ├── marketplace/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       ├── page.tsx
│       │   │   │   │   │       └── loading.tsx # ← ADDED
│       │   │   │   │   │
│       │   │   │   │   ├── squads/             # ← ADDED
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── chat/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   │
│       │   │   │   │   ├── verification/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       ├── page.tsx
│       │   │   │   │   │       └── loading.tsx # ← ADDED
│       │   │   │   │   │
│       │   │   │   │   ├── subscriptions/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── plans/          # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── [id]/           # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── payments/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── transactions/   # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── refunds/        # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── emails/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── templates/      # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── compose/        # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── advertising/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── create/
│       │   │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   │   └── loading.tsx # ← ADDED
│       │   │   │   │   │   └── [id]/           # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── analytics/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── users/          # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── revenue/        # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── engagement/     # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── security/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── loading.tsx     # ← ADDED
│       │   │   │   │   │   ├── threats/        # ← ADDED
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── blocked/        # ← ADDED
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── audit-logs/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── loading.tsx     # ← ADDED
│       │   │   │   │   │
│       │   │   │   │   ├── reports/            # ← ADDED
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   ├── announcements/      # ← ADDED
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── create/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   │
│       │   │   │   │   └── settings/
│       │   │   │   │       ├── page.tsx
│       │   │   │   │       ├── loading.tsx     # ← ADDED
│       │   │   │   │       ├── roles/          # ← ADDED
│       │   │   │   │       │   └── page.tsx
│       │   │   │   │       └── system/         # ← ADDED
│       │   │   │   │           └── page.tsx
│       │   │   │   │
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── loading.tsx             # ← ADDED
│       │   │   │   └── error.tsx               # ← ADDED
│       │   │   │
│       │   │   ├── share/
│       │   │   │   └── [username]/
│       │   │   │       ├── page.tsx
│       │   │   │       └── loading.tsx         # ← ADDED
│       │   │   │
│       │   │   ├── api/
│       │   │   │   ├── webhooks/
│       │   │   │   │   └── zainpay/
│       │   │   │   │       └── route.ts
│       │   │   │   │
│       │   │   │   ├── auth/                   # ← ADDED: Auth API routes
│       │   │   │   │   ├── [...nextauth]/      # If using NextAuth (optional)
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── refresh/
│       │   │   │   │       └── route.ts
│       │   │   │   │
│       │   │   │   └── health/                 # ← ADDED: Health check
│       │   │   │       └── route.ts
│       │   │   │
│       │   │   ├── layout.tsx
│       │   │   ├── not-found.tsx
│       │   │   ├── error.tsx
│       │   │   ├── loading.tsx
│       │   │   └── globals.css
│       │   │
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Card.tsx
│       │   │   │   ├── Modal.tsx
│       │   │   │   ├── Dropdown.tsx
│       │   │   │   ├── Avatar.tsx
│       │   │   │   ├── Badge.tsx
│       │   │   │   ├── Tabs.tsx
│       │   │   │   ├── Table.tsx
│       │   │   │   ├── Pagination.tsx
│       │   │   │   ├── Skeleton.tsx
│       │   │   │   ├── Toast.tsx
│       │   │   │   ├── Loading.tsx
│       │   │   │   ├── Textarea.tsx            # ← ADDED
│       │   │   │   ├── Select.tsx              # ← ADDED
│       │   │   │   ├── Checkbox.tsx            # ← ADDED
│       │   │   │   ├── Radio.tsx               # ← ADDED
│       │   │   │   ├── Switch.tsx              # ← ADDED
│       │   │   │   ├── Slider.tsx              # ← ADDED
│       │   │   │   ├── Progress.tsx            # ← ADDED
│       │   │   │   ├── Alert.tsx               # ← ADDED
│       │   │   │   ├── Tooltip.tsx             # ← ADDED
│       │   │   │   ├── Popover.tsx             # ← ADDED
│       │   │   │   ├── Dialog.tsx              # ← ADDED
│       │   │   │   ├── Sheet.tsx               # ← ADDED
│       │   │   │   ├── Separator.tsx           # ← ADDED
│       │   │   │   ├── ScrollArea.tsx          # ← ADDED
│       │   │   │   ├── Accordion.tsx           # ← ADDED
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── Footer.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Navigation.tsx
│       │   │   │   ├── MobileNav.tsx
│       │   │   │   ├── AdminSidebar.tsx
│       │   │   │   ├── AdminHeader.tsx         # ← ADDED
│       │   │   │   ├── Breadcrumbs.tsx         # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── auth/
│       │   │   │   ├── LoginForm.tsx
│       │   │   │   ├── RegisterForm.tsx
│       │   │   │   ├── ForgotPasswordForm.tsx
│       │   │   │   ├── TwoFactorForm.tsx
│       │   │   │   ├── ResetPasswordForm.tsx   # ← ADDED
│       │   │   │   ├── VerifyEmailForm.tsx     # ← ADDED
│       │   │   │   ├── AuthGuard.tsx           # ← ADDED
│       │   │   │   ├── RoleGuard.tsx           # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── solutions/
│       │   │   │   ├── SolutionCard.tsx
│       │   │   │   ├── SolutionList.tsx
│       │   │   │   ├── SolutionForm.tsx
│       │   │   │   ├── SolutionDetail.tsx
│       │   │   │   ├── RatingForm.tsx
│       │   │   │   ├── CategoryFilter.tsx
│       │   │   │   ├── SolutionGrid.tsx        # ← ADDED
│       │   │   │   ├── SolutionSkeleton.tsx    # ← ADDED
│       │   │   │   ├── ComplaintForm.tsx       # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── jobs/
│       │   │   │   ├── JobCard.tsx
│       │   │   │   ├── JobList.tsx
│       │   │   │   ├── JobForm.tsx
│       │   │   │   ├── JobDetail.tsx
│       │   │   │   ├── ApplicationForm.tsx
│       │   │   │   ├── JobFilters.tsx          # ← ADDED
│       │   │   │   ├── JobSkeleton.tsx         # ← ADDED
│       │   │   │   ├── CollaborationCard.tsx   # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── marketplace/
│       │   │   │   ├── ListingCard.tsx
│       │   │   │   ├── ListingList.tsx
│       │   │   │   ├── ListingForm.tsx
│       │   │   │   ├── ListingDetail.tsx
│       │   │   │   ├── BountyForm.tsx
│       │   │   │   ├── BountyCard.tsx          # ← ADDED
│       │   │   │   ├── ListingSkeleton.tsx     # ← ADDED
│       │   │   │   ├── EscrowStatus.tsx        # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── chat/
│       │   │   │   ├── ChatRoom.tsx
│       │   │   │   ├── MessageList.tsx
│       │   │   │   ├── MessageInput.tsx
│       │   │   │   ├── ChatSidebar.tsx
│       │   │   │   ├── AnnouncementBanner.tsx
│       │   │   │   ├── MessageBubble.tsx       # ← ADDED
│       │   │   │   ├── RoomList.tsx            # ← ADDED
│       │   │   │   ├── TypingIndicator.tsx     # ← ADDED
│       │   │   │   ├── OnlineStatus.tsx        # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── squads/
│       │   │   │   ├── SquadCard.tsx
│       │   │   │   ├── SquadList.tsx
│       │   │   │   ├── SquadForm.tsx
│       │   │   │   ├── SquadDetail.tsx
│       │   │   │   ├── SquadMemberCard.tsx     # ← ADDED
│       │   │   │   ├── SquadInviteForm.tsx     # ← ADDED
│       │   │   │   ├── SquadApplicationForm.tsx # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── profile/
│       │   │   │   ├── ProfileCard.tsx
│       │   │   │   ├── ProfileForm.tsx
│       │   │   │   ├── VerificationForm.tsx
│       │   │   │   ├── AchievementBadges.tsx
│       │   │   │   ├── ShareableProfile.tsx
│       │   │   │   ├── ProfileHeader.tsx       # ← ADDED
│       │   │   │   ├── ProfileStats.tsx        # ← ADDED
│       │   │   │   ├── ProfileSkeleton.tsx     # ← ADDED
│       │   │   │   ├── QRCodeCard.tsx          # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── subscription/
│       │   │   │   ├── PricingCard.tsx
│       │   │   │   ├── SubscriptionPlan.tsx
│       │   │   │   ├── PaymentForm.tsx
│       │   │   │   ├── PricingTable.tsx        # ← ADDED
│       │   │   │   ├── FeatureComparison.tsx   # ← ADDED
│       │   │   │   ├── CurrentPlanCard.tsx     # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── notifications/              # ← ADDED
│       │   │   │   ├── NotificationCard.tsx
│       │   │   │   ├── NotificationList.tsx
│       │   │   │   ├── NotificationDropdown.tsx
│       │   │   │   ├── NotificationBadge.tsx
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── leaderboard/                # ← ADDED
│       │   │   │   ├── LeaderboardTable.tsx
│       │   │   │   ├── LeaderboardCard.tsx
│       │   │   │   ├── RankBadge.tsx
│       │   │   │   ├── LeaderboardFilters.tsx
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── knowledge-hub/              # ← ADDED
│       │   │   │   ├── ArticleCard.tsx
│       │   │   │   ├── ArticleList.tsx
│       │   │   │   ├── ArticleContent.tsx
│       │   │   │   ├── CategoryNav.tsx
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── payment/                    # ← ADDED
│       │   │   │   ├── ZainpayCheckout.tsx
│       │   │   │   ├── PaymentStatus.tsx
│       │   │   │   ├── TransactionHistory.tsx
│       │   │   │   ├── WalletCard.tsx
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── admin/
│       │   │   │   ├── DashboardStats.tsx
│       │   │   │   ├── UserTable.tsx
│       │   │   │   ├── VerificationQueue.tsx
│       │   │   │   ├── AnalyticsChart.tsx
│       │   │   │   ├── AuditLogTable.tsx
│       │   │   │   ├── AdCampaignForm.tsx
│       │   │   │   ├── QuickActions.tsx        # ← ADDED
│       │   │   │   ├── RecentActivity.tsx      # ← ADDED
│       │   │   │   ├── RevenueChart.tsx        # ← ADDED
│       │   │   │   ├── UserGrowthChart.tsx     # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── common/
│       │   │   │   ├── SearchBar.tsx
│       │   │   │   ├── FilterPanel.tsx
│       │   │   │   ├── SortDropdown.tsx
│       │   │   │   ├── EmptyState.tsx
│       │   │   │   ├── ErrorBoundary.tsx
│       │   │   │   ├── SEO.tsx
│       │   │   │   ├── Logo.tsx                # ← ADDED
│       │   │   │   ├── FileUpload.tsx          # ← ADDED
│       │   │   │   ├── ImageUpload.tsx         # ← ADDED
│       │   │   │   ├── ConfirmDialog.tsx       # ← ADDED
│       │   │   │   ├── DataTable.tsx           # ← ADDED
│       │   │   │   ├── StatCard.tsx            # ← ADDED
│       │   │   │   ├── InfiniteScroll.tsx      # ← ADDED
│       │   │   │   ├── CopyToClipboard.tsx     # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── forms/                      # ← ADDED
│       │   │   │   ├── FormField.tsx
│       │   │   │   ├── FormError.tsx
│       │   │   │   ├── FormLabel.tsx
│       │   │   │   ├── FormDescription.tsx
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   └── providers/
│       │   │       ├── ApolloProvider.tsx
│       │   │       ├── AuthProvider.tsx
│       │   │       ├── SocketProvider.tsx
│       │   │       ├── ToastProvider.tsx
│       │   │       ├── ThemeProvider.tsx
│       │   │       ├── QueryProvider.tsx       # ← ADDED: React Query
│       │   │       └── index.ts                # ← ADDED
│       │   │
│       │   ├── lib/
│       │   │   ├── apollo/
│       │   │   │   ├── client.ts
│       │   │   │   ├── queries/
│       │   │   │   │   ├── user.queries.ts
│       │   │   │   │   ├── solution.queries.ts
│       │   │   │   │   ├── job.queries.ts
│       │   │   │   │   ├── marketplace.queries.ts
│       │   │   │   │   ├── chat.queries.ts
│       │   │   │   │   ├── squad.queries.ts
│       │   │   │   │   ├── subscription.queries.ts
│       │   │   │   │   ├── notification.queries.ts # ← ADDED
│       │   │   │   │   ├── leaderboard.queries.ts  # ← ADDED
│       │   │   │   │   ├── admin.queries.ts
│       │   │   │   │   └── index.ts
│       │   │   │   │
│       │   │   │   ├── mutations/
│       │   │   │   │   ├── user.mutations.ts
│       │   │   │   │   ├── solution.mutations.ts
│       │   │   │   │   ├── job.mutations.ts
│       │   │   │   │   ├── marketplace.mutations.ts
│       │   │   │   │   ├── chat.mutations.ts
│       │   │   │   │   ├── squad.mutations.ts
│       │   │   │   │   ├── subscription.mutations.ts
│       │   │   │   │   ├── payment.mutations.ts    # ← ADDED
│       │   │   │   │   ├── notification.mutations.ts # ← ADDED
│       │   │   │   │   ├── admin.mutations.ts
│       │   │   │   │   └── index.ts
│       │   │   │   │
│       │   │   │   ├── subscriptions/          # ← ADDED
│       │   │   │   │   ├── chat.subscriptions.ts
│       │   │   │   │   ├── notification.subscriptions.ts
│       │   │   │   │   └── index.ts
│       │   │   │   │
│       │   │   │   ├── fragments/
│       │   │   │   │   ├── user.fragments.ts   # ← ADDED
│       │   │   │   │   ├── solution.fragments.ts # ← ADDED
│       │   │   │   │   └── index.ts
│       │   │   │   │
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── socket/
│       │   │   │   ├── client.ts
│       │   │   │   ├── events.ts
│       │   │   │   ├── handlers.ts             # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── auth/
│       │   │   │   ├── session.ts
│       │   │   │   ├── tokens.ts
│       │   │   │   ├── permissions.ts          # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   ├── zainpay/                    # ← ADDED: Zainpay client
│       │   │   │   ├── client.ts
│       │   │   │   ├── types.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── utils/
│       │   │   │   ├── cn.ts
│       │   │   │   ├── format.ts
│       │   │   │   ├── validation.ts
│       │   │   │   ├── constants.ts
│       │   │   │   ├── date.ts                 # ← ADDED
│       │   │   │   ├── storage.ts              # ← ADDED
│       │   │   │   ├── helpers.ts              # ← ADDED
│       │   │   │   └── index.ts                # ← ADDED
│       │   │   │
│       │   │   └── index.ts                    # ← ADDED
│       │   │
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useSocket.ts
│       │   │   ├── useDebounce.ts
│       │   │   ├── useLocalStorage.ts
│       │   │   ├── usePagination.ts
│       │   │   ├── useInfiniteScroll.ts
│       │   │   ├── useMediaQuery.ts            # ← ADDED
│       │   │   ├── useOnClickOutside.ts        # ← ADDED
│       │   │   ├── useClipboard.ts             # ← ADDED
│       │   │   ├── useDisclosure.ts            # ← ADDED
│       │   │   ├── useToast.ts                 # ← ADDED
│       │   │   ├── useUser.ts                  # ← ADDED
│       │   │   ├── useSolutions.ts             # ← ADDED
│       │   │   ├── useJobs.ts                  # ← ADDED
│       │   │   ├── useNotifications.ts         # ← ADDED
│       │   │   └── index.ts
│       │   │
│       │   ├── store/
│       │   │   ├── authStore.ts
│       │   │   ├── chatStore.ts
│       │   │   ├── notificationStore.ts
│       │   │   ├── uiStore.ts                  # ← ADDED
│       │   │   ├── filterStore.ts              # ← ADDED
│       │   │   └── index.ts
│       │   │
│       │   ├── types/
│       │   │   ├── user.types.ts
│       │   │   ├── solution.types.ts
│       │   │   ├── job.types.ts
│       │   │   ├── marketplace.types.ts
│       │   │   ├── chat.types.ts
│       │   │   ├── squad.types.ts
│       │   │   ├── subscription.types.ts
│       │   │   ├── admin.types.ts
│       │   │   ├── payment.types.ts            # ← ADDED
│       │   │   ├── notification.types.ts       # ← ADDED
│       │   │   ├── common.types.ts             # ← ADDED
│       │   │   ├── api.types.ts                # ← ADDED
│       │   │   └── index.ts
│       │   │
│       │   ├── constants/                      # ← ADDED
│       │   │   ├── routes.ts
│       │   │   ├── api.ts
│       │   │   ├── config.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── middleware.ts                   # ← ADDED: Next.js middleware
│       │   │
│       │   └── styles/                         # Keep only for additional styles
│       │       ├── components.css              # ← RENAMED/REPURPOSED
│       │       └── index.css                   # ← ADDED: Main import
│       │
│       ├── public/
│       │   ├── icons/
│       │   │   ├── icon-72x72.png
│       │   │   ├── icon-96x96.png
│       │   │   ├── icon-128x128.png
│       │   │   ├── icon-144x144.png
│       │   │   ├── icon-152x152.png
│       │   │   ├── icon-192x192.png
│       │   │   ├── icon-384x384.png
│       │   │   ├── icon-512x512.png
│       │   │   ├── apple-touch-icon.png        # ← ADDED
│       │   │   └── favicon.ico                 # ← ADDED
│       │   │
│       │   ├── images/
│       │   │   ├── logo.svg
│       │   │   ├── logo-dark.svg
│       │   │   ├── placeholder.png
│       │   │   ├── avatar-placeholder.png      # ← ADDED
│       │   │   ├── empty-state.svg             # ← ADDED
│       │   │   ├── 404.svg                     # ← ADDED
│       │   │   ├── error.svg                   # ← ADDED
│       │   │   └── og-image.png                # ← ADDED
│       │   │
│       │   ├── fonts/                          # ← ADDED
│       │   │   └── .gitkeep
│       │   │
│       │   ├── manifest.json
│       │   ├── sw.js
│       │   ├── robots.txt
│       │   └── sitemap.xml
│       │
│       ├── .env.example
│       ├── .env.local.example                  # ← ADDED: Local dev env
│       ├── .eslintrc.json
│       ├── .prettierrc
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       ├── postcss.config.mjs                  # ← ADDED
│       ├── tsconfig.json
│       ├── package.json
│       ├── vercel.json
│       ├── components.json                     # ← ADDED: shadcn/ui config
│       └── README.md
│
├── packages/
│   └── shared/
│       ├── constants/
│       │   ├── categories.js
│       │   ├── roles.js
│       │   ├── subscriptionTiers.js
│       │   ├── countries.js                    # ← ADDED
│       │   ├── languages.js                    # ← ADDED
│       │   ├── errorCodes.js                   # ← ADDED
│       │   └── index.js
│       │
│       ├── types/
│       │   ├── index.d.ts
│       │   ├── user.d.ts                       # ← ADDED
│       │   ├── solution.d.ts                   # ← ADDED
│       │   └── payment.d.ts                    # ← ADDED
│       │
│       ├── utils/                              # ← ADDED
│       │   ├── validators.js
│       │   ├── formatters.js
│       │   └── index.js
│       │
│       ├── schemas/                            # ← ADDED: Shared validation schemas
│       │   ├── user.schema.js
│       │   ├── solution.schema.js
│       │   └── index.js
│       │
│       └── package.json
│
├── scripts/
│   ├── seed.js
│   ├── migrate.js
│   ├── cleanup.js
│   ├── generate-types.js                       # ← ADDED
│   ├── setup.js                                # ← ADDED: Initial setup
│   └── deploy.js                               # ← ADDED
│
├── docs/                                       # ← ADDED: Documentation
│   ├── api/
│   │   └── README.md
│   ├── architecture/
│   │   └── README.md
│   ├── deployment/
│   │   └── README.md
│   └── README.md
│
├── .gitignore
├── .nvmrc
├── .editorconfig                               # ← ADDED
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.dev.yml                      # ← ADDED
├── Makefile                                    # ← ADDED: Common commands
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── CONTRIBUTING.md                             # ← ADDED
├── CHANGELOG.md                                # ← ADDED
├── README.md
└── LICENSE



{
  "name": "@stackkin/backend",
  "version": "1.0.0",
  "description": "Stackkin Backend API - Express + GraphQL + MongoDB",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "build": "echo 'No build step required for Node.js'",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch",
    "test:coverage": "node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage",
    "seed": "node scripts/seed.js",
    "migrate": "node scripts/migrate.js"
  },
  "keywords": [
    "stackkin",
    "api",
    "graphql",
    "express",
    "mongodb",
    "developers",
    "solutions"
  ],
  "author": "Stackkin Team",
  "license": "MIT",
  "dependencies": {
    "@graphql-tools/merge": "^9.0.1",
    "@graphql-tools/schema": "^10.0.2",
    "apollo-server-express": "^3.13.0",
    "axios": "^1.6.2",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^1.41.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dataloader": "^2.2.2",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "graphql": "^16.8.1",
    "graphql-depth-limit": "^1.1.0",
    "graphql-scalars": "^1.22.4",
    "graphql-subscriptions": "^2.0.0",
    "graphql-upload": "^16.0.2",
    "graphql-ws": "^5.14.2",
    "helmet": "^7.1.0",
    "hpp": "^0.2.3",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "multer-storage-cloudinary": "^4.0.0",
    "node-cron": "^3.0.3",
    "slugify": "^1.6.6",
    "socket.io": "^4.7.2",
    "uuid": "^9.0.1",
    "validator": "^13.11.0",
    "winston": "^3.11.0",
    "xss-clean": "^0.1.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "prettier": "^3.1.1",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/stackkin/stackkin.git"
  }
}

# ============================================
# STACKKIN BACKEND ENVIRONMENT CONFIGURATION
# ============================================

# Application
NODE_ENV=development
PORT=4000
APP_NAME=stackkin
APP_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/stackkin_dev
# For MongoDB Atlas (Production)
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/stackkin?retryWrites=true&w=majority

# Redis (Upstash)
REDIS_URL=redis://localhost:6379
# For Upstash (Production)
# REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379

# JWT Configuration (Custom Auth)
JWT_ACCESS_SECRET=your-super-secret-access-token-key-min-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-min-32-chars-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=stackkin
JWT_AUDIENCE=stackkin-users

# Password Hashing
BCRYPT_SALT_ROUNDS=12
PASSWORD_PEPPER=your-password-pepper-secret-key

# Session Configuration
SESSION_SECRET=your-session-secret-key-min-32-chars
SESSION_NAME=stackkin_sid
SESSION_MAX_AGE=86400000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Zainpay Configuration
ZAINPAY_PUBLIC_KEY=your-zainpay-public-key
ZAINPAY_SECRET_KEY=your-zainpay-secret-key
ZAINPAY_ZAINBOX_CODE=your-zainbox-code
ZAINPAY_CALLBACK_URL=https://your-domain.com/webhooks/zainpay
ZAINPAY_SANDBOX=true

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@stackkin.com
EMAIL_FROM_NAME=Stackkin

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# GraphQL
GRAPHQL_DEPTH_LIMIT=10
GRAPHQL_INTROSPECTION=true
GRAPHQL_PLAYGROUND=true

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000
SOCKET_PATH=/socket.io

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# Security
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key!
ENCRYPTION_IV_LENGTH=16

# Two-Factor Authentication
TWO_FACTOR_APP_NAME=Stackkin
TWO_FACTOR_DIGITS=6
TWO_FACTOR_STEP=30

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined

# Admin Defaults
SUPER_ADMIN_EMAIL=admin@stackkin.com
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_TWO_FACTOR=true
ENABLE_RATE_LIMITING=true

# Cache TTL (seconds)
CACHE_TTL_SHORT=300
CACHE_TTL_MEDIUM=1800
CACHE_TTL_LONG=86400

# Subscription Pricing (Kobo)
SUBSCRIPTION_BASE_YEARLY=1000000
SUBSCRIPTION_BASE_LIFETIME=5000000
SUBSCRIPTION_MID_YEARLY=2500000
SUBSCRIPTION_TOP_HALF_YEARLY=2000000
SUBSCRIPTION_TOP_YEARLY=3500000

# Job Posting Prices (Kobo) by Tier
JOB_POSTING_PRICE_FREE=50000
JOB_POSTING_PRICE_BASE=40000
JOB_POSTING_PRICE_MID=30000
JOB_POSTING_PRICE_TOP=20000

# Marketplace Slot Prices (Kobo) by Tier
SLOT_PRICE_FREE=30000
SLOT_PRICE_BASE=25000
SLOT_PRICE_MID=20000
SLOT_PRICE_TOP=15000

# Solution Premium Upgrade Price (Kobo)
SOLUTION_PREMIUM_UPGRADE_PRICE=15000 

{
  "name": "@stackkin/frontend",
  "version": "1.0.0",
  "description": "Stackkin Frontend - Next.js 14 Progressive Web App",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx,js,jsx,json,css}'",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true next build"
  },
  "dependencies": {
    "@apollo/client": "^3.8.8",
    "@hookform/resolvers": "^3.3.2",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.14.2",
    "@tanstack/react-query-devtools": "^5.14.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "framer-motion": "^10.16.16",
    "graphql": "^16.8.1",
    "graphql-ws": "^5.14.2",
    "lodash": "^4.17.21",
    "lucide-react": "^0.303.0",
    "next": "14.0.4",
    "next-pwa": "^5.6.0",
    "next-themes": "^0.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "react-hook-form": "^7.49.2",
    "react-hot-toast": "^2.4.1",
    "react-intersection-observer": "^9.5.3",
    "react-markdown": "^9.0.1",
    "recharts": "^2.10.3",
    "socket.io-client": "^4.7.2",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^14.0.4",
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "@types/lodash": "^4.14.202",
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-tailwindcss": "^3.13.1",
    "postcss": "^8.4.32",
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.9",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}


# ============================================
# STACKKIN FRONTEND PRODUCTION CONFIGURATION
# ============================================

# API Configuration
NEXT_PUBLIC_API_URL=https://api.stackkin.com
NEXT_PUBLIC_GRAPHQL_URL=https://api.stackkin.com/graphql
NEXT_PUBLIC_WS_URL=wss://api.stackkin.com
NEXT_PUBLIC_SOCKET_URL=https://api.stackkin.com

# Application
NEXT_PUBLIC_APP_NAME=stackkin
NEXT_PUBLIC_APP_URL=https://stackkin.com
NEXT_PUBLIC_APP_TAGLINE=Where the software society share solutions, services, and success

# Zainpay (Public Key Only)
NEXT_PUBLIC_ZAINPAY_PUBLIC_KEY=your-zainpay-public-key
NEXT_PUBLIC_ZAINPAY_SANDBOX=false

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=stackkin-uploads

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=true

# PWA Configuration
NEXT_PUBLIC_PWA_NAME=Stackkin
NEXT_PUBLIC_PWA_SHORT_NAME=Stackkin
NEXT_PUBLIC_PWA_DESCRIPTION=Where the software society share solutions, services, and success
NEXT_PUBLIC_PWA_THEME_COLOR=#6366f1
NEXT_PUBLIC_PWA_BACKGROUND_COLOR=#ffffff

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Social Links
NEXT_PUBLIC_TWITTER_URL=https://twitter.com/stackkin
NEXT_PUBLIC_GITHUB_URL=https://github.com/stackkin
NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/company/stackkin



Name: stackkin
Tagline: "Where the software society share solutions, services, and success"
Mission: A collaborative platform where developers share technical solutions, find employment, and build professional credibility through verified achievements.

Key Differentiators:

Shareable profile links showcasing complete achievements

Squad-based collaboration (micro-agencies)

Tiered subscription model with escalating privileges

Custom authentication & role-based authorization system

Zainpay integration for all payments

Core Platform Architecture
Technical Stack Requirements
Backend:

Runtime: Node.js with Express.js (ES Modules)

Database: MongoDB (NoSQL)

API: GraphQL

Language: JavaScript

Authentication: Custom JWT implementation (no third-party libraries)

Frontend:

Framework: Next.js 14+ (App Router)

Language: TypeScript (TS/TSX)

Module Type: ES Modules

Infrastructure & Scaling:

Horizontal scaling support for high concurrent users

Load balancing across multiple instances

Database sharding for large datasets

Redis caching for session management

CDN for static assets

Security Architecture:

Custom authentication & authorization system

Role-based access control (RBAC)

Password hashing with bcrypt and salt

Rate limiting and DDoS protection

HTTPS enforcement with input sanitization

Subscription Tiers & Feature Matrix
1. No Subscription (Free Tier)
Jobs: 1 free posting, subsequent paid (highest price tier)

Solutions: Unlimited postings, standard visibility

Marketplace: 1 free slot, subsequent paid

Chat: Basic access (own country + 2 language rooms)

Talent Pool: No access

Announcements: Cannot post

2. Base Subscription (Basic Premium)
Jobs: 2 total postings, cheaper rates, free collaboration postings

Solutions: Prioritized within categories only

Marketplace: 2 total slots, flagged as premium in category

Chat: Enhanced access (multiple countries + 5 language rooms)

Talent Pool: No access

Cost: Yearly or Lifetime

3. Mid Subscription (Professional Premium)
Jobs: 3 total postings, premium section visibility

Solutions: Enhanced visibility, upgradable to premium per-solution

Marketplace: 3 total slots, premium section priority

Chat: Unlimited country & language rooms

Talent Pool: View and shortlist candidates

Announcements: Cannot post

Cost: Yearly only

4. Top Subscription (Global Premium)
Jobs: 4 total postings (renews every 6 months), globally pinned

Solutions: Automatic premium status, global priority

Marketplace: 5 total slots (renews every 6 months), globally pinned

Chat: Full announcement privileges

Talent Pool: Full access with direct contact

Features: Promotional ads, mentorship office hours

Cost: Half-yearly or Yearly

Core Feature Flows
Solutions Management
Posting Flow:

Required: Title, contact, description, use cases, category, tech stack

Optional: Documentation links, attachments (10MB max), demo URL

Types: Applications, dev tools, integrations, tutorials, bounties

Rating & Moderation:

1-5 star ratings with mandatory comments (20+ chars)

Complaint system with admin escalation

Top 3 solutions per category (weekly updates)

Premium solutions get priority placement

Job Board
All job postings require payment (Zainpay integration)

Free collaboration postings available

Tier-based visibility (Free → Base → Mid → Top priority)

Admin moderation for all postings

Marketplace
Buy/sell/lease tech products & services

Slot-based system (1 product per slot)

Zainpay escrow for bounties

Tier-based listing visibility

Chat System
General Chat: Open to all

Category Chat: Solution-specific discussions

Country Chat: Local networking (tier-based access)

Language Chat: Programming language rooms

Premium Chat: Exclusive to premium users

Collaboration Posts: Free project invites

User Verification (isVerified)
Process:

Nigerian users: NIN + NIN card image

International: Government ID/Passport/Driver's license

Admin review queue with approval/rejection

Verified badge boosts credibility across platform

Benefits:

Higher trust in job applications

Priority in marketplace transactions

Verified squad eligibility

Squads (Micro-Agencies)
2-10 member collaborative teams

Verification status based on member verification ratio

Combined achievement metrics

Unified job applications with single contract

Search priority for verified squads

Admin Role Matrix (11 Specialized Roles)
Super Admin (Platform Owner)
Full system control and admin management

Infrastructure scaling for 10,000+ concurrent users

Specialized Admin Roles:
User Management: Account moderation, verification requests

Solutions Management: Content moderation, performance tracking

Job Board: Posting approval, dispute resolution

Marketplace: Listing approval, transaction oversight

Chat & Community: Room moderation, announcement management

Verification: Document review, fraud detection

Subscription & Payment: Revenue tracking, refunds

Email & Notification: Template management, delivery tracking

Advertising: Campaign creation, performance analytics

Analytics & Reporting: Platform-wide metrics, business intelligence

Security: Threat monitoring, compliance enforcement

Each role has specific tracked metrics and functional boundaries.

Payment Integration (Zainpay)
Required Endpoints:
CREATE_ZAINBOX - Create merchant account

CREATE_VIRTUAL_ACCOUNT - User payment accounts

VIRTUAL_ACCOUNT_BALANCE - Balance checking

INITIALIZE_PAYMENT - Card payment processing

FUNDS_TRANSFER - Internal transfers

MERCHANT_TRANSACTIONS - Transaction history

Payment Types Supported:
Virtual account deposits

Card payments (redirect & inlineJS)

Recurring payments with tokenization

Dynamic virtual accounts (time-limited)

Escrow services for bounties

Webhook Events:
Deposit notifications (success/failed)

Transfer notifications

Payment verification

Auto-settlement to internal accounts

Security:
HmacSHA256 signature verification

Sandbox mode for testing

Encrypted payload transmission

User Experience Flows
Registration & Onboarding
Step 1: Basic info (name, email, password)

Step 2: Profile info (nationality, tech stack, employment status)

Step 3: Email verification (24-hour expiry)

Step 4: Progressive profile completion

Design Principle: Simple, direct, minimal steps to productivity

Home Page Structure
Hero section with premium highlights

Top solutions showcase

Categories overview with counts

Top performers section

Real-time community activity feed

Talent pool preview (teaser)

Marketplace preview

Platform metrics dashboard

Profile System
Complete achievement tracking

Solution portfolio with ratings

Employment status toggle

Squad membership display

Shareable public profile link

QR code for quick sharing

Advanced Features
Gamification System
Achievement badges (First Solution, Top Rated, Verified Contributor, etc.)

Leaderboards (weekly, monthly, quarterly, yearly)

Streak system with protection (1 skip per 7 days)

Knowledge Hub
Curated documentation library

Community wiki with peer review

Structured learning paths

Progress tracking

Advanced Search & Filters
Solutions: Category, language, country, rating, premium status

Talent Pool: Tech stack, verification, availability, experience

Marketplace: Category, price, condition, seller verification

Bounty System (Reverse Marketplace)
User posts requirements with budget

Developers submit proposals

Funds held in Zainpay escrow

Bounty poster selects winner

Funds released upon acceptance

Mentorship Office Hours
Top-tier users can offer 30-minute slots

Set availability and expertise areas

Free or paid sessions

Calendar integration

Deployment Architecture
Environment Setup:
Backend Hosting: Railway (free tier)

Frontend Hosting: Vercel

Database: MongoDB Atlas (512MB free tier)

Caching: Upstash Redis (free tier)

File Storage: Cloudinary (25GB free tier)

Email Service: Resend

Scalability Considerations:
Auto-scaling based on concurrent users

Database indexing optimization

CDN for global asset delivery

Session distribution across Redis clusters

GraphQL query complexity limiting

Monitoring & Analytics:
Real-time performance dashboards

Error tracking and alerting

User behavior analytics

Revenue tracking by subscription tier

Admin activity audit logs

Critical Implementation Requirements
Authentication & Authorization
Must build custom (no libraries like Passport.js)

JWT token management with refresh mechanism

Role-based permission system throughout app

Two-factor authentication for admin roles

Session management with device tracking

Security Compliance
GDPR and data protection compliance

Regular security audits

Input validation on all endpoints

SQL injection prevention

XSS and CSRF protection

Performance Optimization
GraphQL query optimization

MongoDB indexing strategy

Redis caching for frequent queries

Lazy loading for media assets

Bundle size optimization for frontend

Internationalization
Multi-language support (English, French, Spanish, Arabic, Portuguese, Hindi, Chinese)

Country-specific content filtering

Localized chat rooms

Regional payment method support

Success Metrics & KPIs
User Engagement:
Daily/Monthly Active Users (DAU/MAU)

Solution posting frequency

Chat room activity levels

Job application rates

Monetization:
Subscription conversion rates

Job posting revenue

Marketplace transaction volume

Premium feature adoption

Quality Metrics:
User verification rate

Solution rating averages

Dispute resolution time

Customer support response time

Technical Performance:
API response times

Page load speeds

Uptime percentage

Error rate monitoring

Risk Mitigation Strategies
Technical Risks:
Implement comprehensive error handling

Regular database backups

DDoS protection services

Load testing before major releases

Business Risks:
Fraud detection for marketplace transactions

Content moderation for compliance

Payment dispute resolution process

Scalability planning for user growth

Security Risks:
Regular security audits

Penetration testing

Data encryption at rest and in transit

Access log monitoring




use Zainpay for payment transactions 

module.exports = {
  CREATE_ZAINBOX: {
      name: "CREATE_ZAINBOX",
      url: '/zainbox/create/request',
      method: 'post',
  },
  ZAINBOXES: {
      name: "ZAINBOXES",
      url: '/zainbox/list',
      method: 'get',
  },
  ZAINBOX_TRANSACTIONS: {
      name: "ZAINBOX_TRANSACTIONS",
      url: '/zainbox/transactions',
      method: 'get',
  },
  MERCHANT_TRANSACTIONS: {
      name: "MERCHANT_TRANSACTIONS",
      url: '/zainbox/transactions',
      method: 'get',
  },
  CREATE_VIRTUAL_ACCOUNT: {
      name: "CREATE_VIRTUAL_ACCOUNT",
      url: '/virtual-account/create/request',
      method: 'post',
  },
  VIRTUAL_ACCOUNTS: {
      name: "VIRTUAL_ACCOUNTS",
      url: 'zainbox/virtual-accounts',
      method: 'get',
  },
  VIRTUAL_ACCOUNT_TRANSACTIONS: {
      name: "VIRTUAL_ACCOUNT_TRANSACTIONS",
      url: '/virtual-account/wallet/transactions',
      method: 'get',
  },

  UPDATE_VIRTUAL_ACCOUNT_STATUS: {
      name: "UPDATE_VIRTUAL_ACCOUNT_STATUS",
      url: '/virtual-account/change/account/status',
      method: 'patch',
  },
  VIRTUAL_ACCOUNT_BALANCE: {
      name: "VIRTUAL_ACCOUNT_BALANCE",
      url: '/virtual-account/wallet/balance',
      method: 'get',
  },
  ALL_VIRTUAL_ACCOUNT_BALANCE: {
      name: "ALL_VIRTUAL_ACCOUNT_BALANCE",
      url: '/zainbox/accounts/balance',
      method: 'get',
  },
  ZAINBOX_PROFILE: {
      name: "ZAINBOX_PROFILE",
      url: '/zainbox/profile',
      method: 'get',
  },
  BANK_LIST: {
      name: "BANK_LIST",
      url: '/bank/list',
      method: 'get',
  },
  NAME_ENQUIRY: {
      name: "NAME_ENQUIRY",
      url: '/bank/name-enquiry',
      method: 'get',
  },
  FUNDS_TRANSFER: {
      name: "FUNDS_TRANSFER",
      url: '/bank/transfer',
      method: 'post',
  },
  TRANSFER_VERIFICATION: {
      name: "TRANSFER_VERIFICATION",
      url: '/virtual-account/wallet/transaction/verify',
      method: 'get',
  },
  DEPOSIT_VERIFICATION: {
      name: "DEPOSIT_VERIFICATION",
      url: '/virtual-account/wallet/deposit/verify',
      method: 'get',
  },
  TOTAL_PAYMENT_COLLECTED: {
      name: "TOTAL_PAYMENT_COLLECTED",
      url: '/zainbox/transfer/deposit/summary',
      method: 'get',
  },
  CREATE_SCHEDULED_SETTLEMENT: {
      name: "CREATE_SCHEDULED_SETTLEMENT",
      url: '/zainbox/settlement',
      method: 'post',
  },
  GET_SCHEDULED_SETTLEMENT: {
      name: "GET_SCHEDULED_SETTLEMENT",
      url: '/zainbox/settlement',
      method: 'get',
  }, 
  INITIALIZE_PAYMENT: {
      name: "INITIALIZE_PAYMENT",
      url: '/zainbox/card/initialize/payment',
      method: 'post',
  },
  RETRIEVE_PAYMENT_INFO: {
      name: "RETRIEVE_PAYMENT_INFO",
      url: '/zainbox/card/retrieve/payment/info',
      method: 'get',
  },
  GET_CARD_PAYMENT_STATUS: {
      name: "GET_CARD_PAYMENT_STATUS",
      url: '/virtual-account/wallet/deposit/verify',
      method: 'get',
  },
  RECONCILE_CARD_PAYMENT: {
      name: "RECONCILE_CARD_PAYMENT",
      url: '/virtual-account/wallet/transaction/reconcile/card-payment',
      method: 'get',
  },
  RECONCILE_DEPOSIT_PAYMENT: {
      name: "RECONCILE_DEPOSIT_PAYMENT",
      url: '/virtual-account/wallet/transaction/reconcile/bank-deposit',
      method: 'get',
  },
  MAKE_RECURRING_CARD_PAYMENT: {
      name: "MAKE_RECURRING_CARD_PAYMENT",
      url: '/zainbox/card/recurring/purchase',
      method: 'post',
  },
  UPDATE_VIRTUAL_ACCOUNT_BVN: {
      name: "UPDATE_VIRTUAL_ACCOUNT_BVN",
      url: '/virtual-account/update/bvn',
      method: 'post',
  }
}

/**
 * A custom error class for handling the library related errors.
 * @class BaseError
 */
 class BaseError extends Error {
  /**
   * The BaseError Constructor.
   * @param {String} options.message - The error message if any.
   * @constructor BaseError
   */
  constructor(options = {}) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = options.message;
  }
}

module.exports = BaseError;

const BaseError = require('./error.base');
module.exports = BaseError;

const BASE_URL = 'https://sandbox.zainpay.ng';
const BASE_URL_PROD = 'https://api.zainpay.ng';

module.exports = {
    BASE_URL,
    BASE_URL_PROD
};

const handleErrors = (error) => {
  return error.response.data;
};

const handleAxiosError = (error) => {
  return error.message;
};

module.exports = {
  handleErrors,
  handleAxiosError
};

const error = require('./errors')
const constants = require('./constants')
const handleErrors = require('./handle-errors')
const getUrl = require('./url')

module.exports = {
        error,
        constants,
        handleErrors,
        getUrl
}

/**
 * return the sandbox or production URL
 * @param {string} publicKey - Your public key.
 * @returns The base url for the public key
 */
 const getUrl = (sandbox) => {
  const { BASE_URL_PROD, BASE_URL } = require('./constants');

  if (sandbox) {
    return BASE_URL;
  }
  return BASE_URL_PROD;
};

module.exports = getUrl;
const serviceTypes = require("./constants/services");

/**
 * @description initialize the Zainpay wrapper function
 * @param {object} param =>  publicKey, data, serviceType, sandbox
 * @return {function} request function
 */
async function Zainpay(param) {
    const axios = require('axios');
    const {
        getUrl,
        handleErrors,
        handleAxiosError,
    } = require('./utils');
    let { publicKey, serviceType, sandbox, data, params } = param;
    
      /**
   * makes an encrypted call to Zainpay API
   * @param {object} params => publicKey, data, serviceType sandbox
   * @param {function} callback gets called with the result(data) object
   * @return {object} data return decrypted data response object
   */
    if (!publicKey) {
        return console.log('publicKey is required');
    }

    if (!serviceType) {
        return console.log('serviceType is required');
    }

    if (!sandbox) {
        sandbox = false
    }

    try {
        const baseUrl = getUrl(sandbox);
        const axiosStruct = await axios.create({
            baseURL: baseUrl,
            headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + publicKey,
            },
        });

        let { url, method } = serviceTypes[serviceType.name];

        if (params) {
            url = url + "/" + params;
        }

        const response = axiosStruct[method](url, data)
            .then(function (response) {
                if (response.status === 200) {
                    return response.data
                }
            })
            .catch(function (error) {
                return error.response.data
        });

        return await response;
        
    } catch (error) {
        return {
            error: "Request Failed"
        }
    }
}

module.exports = {
    Zainpay,
    serviceTypes
}
Create Zainbox
USE: Create a zainbox. A zainbox is a virtual bucket that allows a merchant to create unlimited multiple virtual accounts.
URL : host/zainbox /virtual-account/create/request
Sandbox Query : https://sandbox.zainpay.ng/zainbox/create/request
Live Query : https://api.zainpay.ng/zainbox/create/request
Required Payload Properties: name, callbackUrl
Optional Payload Properties: emailNotification, description, tags, codeNamePrefix, allowAutoInternalTransfer

Auto Internal Transfer
The Auto Internal Transfer feature in Zainpay simplifies fund settlement by automatically consolidating deposits from all virtual accounts within a Zainbox into a single Internal Settlement Account. This account is automatically generated when the Zainbox is created.

Funds deposited into any virtual account within the Zainbox are automatically transferred to the Internal Settlement Account. Additionally, card payments are also settled directly into this account, providing a unified view of all payment collections within the Zainbox.

The Internal Settlement Account serves as the sole source of payouts or settlements. By consolidating funds into one account, discrepancies and errors during settlement are minimized.

By default, the "allowAutoInternalSettlement "is set to false, meaning it is turned off. This ensures that auto-internal transfers are only initiated when intentionally enabled.

To activate, set allowAutoInternalSettlement to true:

{
    "allowAutoInternalSettlement": true
  }
Once enabled, funds deposited into virtual accounts will begin transferring automatically to the Internal Settlement Account.

Request Payload
MethodPOST

      

{
  "name": "Example Merchant",
  "callbackUrl": "https://example.com/callback",
  "emailNotification": "notify@example.com",
  "description": "This is an example merchant",
  "tags": "tag1, tag2",
  "codeNamePrefix": "EXM",
  "allowAutoInternalTransfer": true
}             
           
      

       
JSON Response

      

{
  "code": "00",
  "data": [
    {
    "callbackUrl": "https://example.com/webhook/zainpay ",
    "codeName": "THbfnDvK5o",
    "emailNotification": "myemail@example.com",
    "name": "test-box",
    "tags": "land, management"
    },
  {
    "callbackUrl": "https://example.com/webhook/zainpay ",
    "codeName": "Zbx9022334",
    "emailNotification": "myemail2@example.com",
    "name": "test-box-2",
    "tags": "charity"
  }
  ],
  "description": "successful",
  "status": "200 OK"
}               
           
      

       
Get all Zainboxes
USE: Get all your created zainboxes
Call Method: GET
URL : host/zainbox/list
Sandbox Query : https://sandbox.zainpay.ng/zainbox/list
Live Query : https://api.zainpay.ng/zainbox/list
Parameter:

JSON Response :

      

{
"code": "00",
    "data": 
[
    {
        "callbackUrl": "https://example.com/webhook/zainpay ",
        "codeName": "THbfnDvK5o",
        "name": "test-box",
        "tags": "land, management"
    },
    {
    "callbackUrl": "https://example.com/webhook/zainpay ",
    "codeName": "rAqwjnYO5chL3QuV7yk0",
    "name": "powershop8",
    "tags": "discos, kedco, aedc"
    }
],
    "description": "successful",
    "status": "Success"
}                           
           
      

       
Update Zainbox
USE: This endpoint is used to update a Zainbox.
URL : host/zainbox/update
Sandbox Query : https://sandbox.zainpay.ng/zainbox/update
Live Query : https://api.zainpay.ng/zainbox/update
Parameter : ZainboxCode(Required), callbackUrl(optional), name(Required), emailNotification(optional)

Request Payload
MethodPATCH

      

{
  "name":"Test One", 
  "tags": "testUpdate",
  "callbackUrl": "https://example.com/ ", 
  "emailNotification": "test@example.com",
  "codeName": "ze73kjdiurwej94sss"
}                    
           
      

       
JSON Response

      

{
"code": "00",
"description": "zainbox successfully updated",
"status": "200 OK"
}
           
      

       
Get all Zainbox Accounts
USE: Get all virtual accounts linked to a zainbox
Call Method: GET
URL : host/zainbox/virtual-accounts/{zainboxCodeName}
Sandbox Query : https://sandbox.zainpay.ng/zainbox/virtual-accounts/{zainboxCodeName}
Live Query : https://api.zainpay.ng/zainbox/virtual-accounts/{zainboxCodeName}
Parameter : zainboxCodeName (required)

JSON Response :

      

[
  {
      "bankAccount": "7966903286",
      "bankName": "035",
      "name": "Go fundme Limited"
  },
  {
      "bankAccount": "7969472891",
      "bankName": "035",
      "name": "Idris Urmi Bello"
  }
]
                  
           
      

       
All Virtual Account Balance of a Zainbox
USE: This endpoint fetches all current account balances for all virtual accounts in a zainbox.
Call Method: GET
URL : host/zainbox/accounts/balance/{zainboxCode}
Sandbox Query : https://sandbox.zainpay.ng/zainbox/accounts/balance/THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/accounts/balance/THbfnDvK5o
Parameter: zainboxCode(Required)

JSON Response

      

{
  "code": "00",
  "data":  
  [
    {
    "accountName": "Aminu Nasar",
    "accountNumber": "7966884043",
    "balanceAmount": 372555,
    "transactionDate": "2021-10-13T13:45:52"
    },
    {
    "accountName": "Khalid Ali Sani",
    "accountNumber": "1234567890",
    "balanceAmount": 200,
    "transactionDate": "2021-12-13T13:45:52"
    },
    {
    "accountName": "Nura Bala Usman",
    "accountNumber": "9900778833",
    "balanceAmount": 105000,
    "transactionDate": "2022-01-29T13:45:52"
    }
  ]
  "description": "successful",
  "status": "Success"
}                 
           
      

       
Zainbox Transactions History
USE: Get a list of transactions from a particular zainbox
Call Method: GET
URL : host/zainbox/transactions/{zainboxCode}
Sandbox Query : https://sandbox.zainpay.ng/zainbox/transactions/THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/transactions/THbfnDvK5o
Parameter: zainboxCode(Required)

JSON Response

      

{
"code": "00",
"data": [
  {
    "accountNumber": "7964524199",
    "amount": 45000,
    "balance": 45000,
    "narration": "",
    "transactionDate": "2021-12-28T11:47:45",
    "transactionRef": "",
    "transactionType": "deposit"
  },
  {
    "accountNumber": "7964524199",
    "amount": 923000,
    "balance": 968000,
    "narration": "",
    "transactionDate": "2021-12-28T11:48:35",
    "transactionRef": "",
    "transactionType": "deposit"
  }],
"description": "successful",
"status": "Success"
}               
          
      

       
Total Payment Collected By Zainbox
USE: Get the sum of total amount collected by all virtual accounts for a particular zainbox in a particular period, for both transfer and deposit transactions
Call Method: GET
URL : host/zainbox/transfer/deposit/summary/{zainboxCode}
Sandbox Query : https://sandbox.zainpay.ng/zainbox/transfer/deposit/summary/THbfnDvK5o?dateFrom=2022-02&dateTo=2022-03
Live Query : https://api.zainpay.ng/zainbox/transfer/deposit/summary/THbfnDvK5o?dateFrom=2022-02&dateTo=2022-03
Parameter: zainboxCode (Required), dateFrom (optional, if not provided, the system returns the data of the current month), dateTo (optional)

JSON Response

      

{
"code": "00",
"data": [
  {
    "count": 4,
    "dateFrom": "2022-02",
    "dateTo": "2022-03",
    "total": "12690",
    "transactionType": "deposit"
  },
    {
    "count": 4,
    "dateFrom": "2022-02",
    "dateTo": "2022-03",
    "total": "29038",
    "transactionType": "transfer"
  }
        ],
"description": "Summary grouped by txn type",
"status": "Success"
}
                             
           
      

       
Zainbox Profile and Current Billing Plan
USE: Get the complete profile of a Zainbox, including the Current Billing Plan for account to account and interBank transfers respectively
Call Method: GET
URL : host/zainbox/profile/{zainboxCode}
Sandbox Query : https://sandbox.zainpay.ng/zainbox/profile/THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/profile/THbfnDvK5o
Parameter : zainboxCode (required)

JSON Response

      

{
"code": "00",
"description": "successful",
"status": "Success",
"data": {
  "zainbox": {
      "callbackUrl": "https://example.com/webhook/zainpay",
      "codeName": "THbfnDvK5o",
      "name": "test-box",
      "tags": "land, management"
      },
  "account2AccountBilling": {
      "fixedCharge": "1000",
      "percentageCharge": 1.5
      },
  "interBankBilling": {
      "fixedCharge": "5000.0",
      "percentageCharge": 1.4
      }
  }
  
}             
           
      

       
Create Settlement
USE: For Scheduling Settlement
Create a scheduled settlement for a zainbox
To create a scheduled settlement for a zainbox., please bear in mind that at any given time, a zainbox can only have one type of settlement.

Planned settlements are divided into three categories.



T1

-

Transaction plus one working day

The value of the T1 schedule. The period must always be on a daily basis.



T7

-

Trasaction plus 7 days

Transaction plus seven days for T7 schedule should be one of Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday



T30

-

Transaction plus 30 days

The schedule Period value for T30 should be 1 - 30 or lastDayOfMonth

 Important Note
Days like February 28th and February 29th, as well as months with only 30 days,

will be covered by lastDayOfMonth

The payload's settlementAccountList parameter is an array/list of bank accounts with their corresponding settlement percentages.

Scenario:
Let's say you have a zainbox with three virtual accounts, and you want to set it up so that the total deposits in these three virtual accounts are split between two accounts at every Transaction plus one day (T1). The first settlement account has 90% of the funds, whereas the second contains only 10%.

Call Method: POST
URL : host/zainbox/settlement
Sandbox Query : https://sandbox.zainpay.ng/zainbox/settlement
Live Query : https://api.zainpay.ng/zainbox/settlement
Token: Required

Request Payload
MethodPOST

      

{
"name": "new-daily-settlement3", "zainboxCode": "THbfnDvK5o", "scheduleType": "T1",
"schedulePeriod": "Daily", "settlementAccountList": 
[
{ "accountNumber":"1234567890", "bankCode":"0009", "percentage": "10" },
{ "accountNumber":"1234567890", "bankCode":"0009", "percentage": "90" }
],
"status": true
}             
           
      

       
JSON Response

      

{
  "code": "00",
  "description": "successful",
  "status": "200 OK"
}              
      
      

       
Deactivating Schedule:
To de-activate a schedule, simply update the payload and set the STATUS parameter to FALSE

API CODES

python

Node.js

CURL
import requests 
    url = "https://api.zainpay.ng/zainbox/settlement" 
    payload = {
        "name": "new-daily-settlement3",
        "scheduleType": "T30",
        "schedulePeriod": "Daily",
        "zainboxCode": "THbfnDvK5op",
        "status": True
        }
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer  your_public_key_here"
        }
        response = requests.request("POST", url, json=payload, headers=headers)
    print(response.text)                                                                                                       
    
Get Settlement
USE: For getting settlement(s) tied to a zainbox
Call Method: GET
URL : host/zainbox/settlement?{zainboxCode}
Sandbox Query : https://sandbox.zainpay.ng/zainbox/settlement?zainboxCode=THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/settlement?zainboxCode=THbfnDvK5o
Parameter : zainboxCode (required)

JSON Response

      

{
	"code": 200,
	"status": "success",
	"description": "Successful",
	"data": {
		"name": "Asusu",
		"schedulePeriod": "Daily",
		"scheduleType": "T1",
		"settlementAccounts": 
    [
      { 
        "accountNumber":"1234567890", 
        "bankCode":"0009", 
        "percentage": "10" 
      },
      { 
        "accountNumber":"1234567890", 
        "bankCode":"0009", 
        "percentage": "90" 
      }
    ],
	"zainbox": "THbfnDvK5o"
 }
}        
           
Create Virtual Account
USE: Create a virtual account. Map a virtual account to a zainbox. A zainbox can hold multiple virtual accounts. Set Bank type string to"fidelity" for a Fidelity Bank virtual account, "fcmb" for FCMB virtual account or "gtBank" for a Guaranty trust Bank virtual account.
Note: Replace Bank type String with the desired Bank type. Available Banks are FidelityBank, FCMB and GT Bank
Call Method: POST
URL : host/zainbox/virtual-account/create/request
Sandbox Query : https://sandbox.zainpay.ng/virtual-account/create/request
Live Query : https://api.zainpay.ng/virtual-account/create/request
Parameter:

Request Payload:
MethodPOST

      

{
"bankType": "gtBank",
"firstName": "Amina12",
"surname": "Test",
"email": "shuaiba11@gmail.com",
"mobileNumber": "08092837262",
"dob": "12-08-1996",
"gender": "M",
"address": "bompai",
"title": "Mr",
"state": "Kano",
"bvn": "22345678901",
"zainboxCode": "THbfnDvK5o"
}                       
      

       
JSON Response

      

{
"code": "00",
"data": {
"bankName": "gtBank",
"email": "shuaiba11@gmail.com",
"accountName": "Betastack Test Amina12",
"accountType": "",
"accountNumber": "2917863937"
},
"description": "successful",
"status": "200 OK"
}    
           
      

       
Virtual Account Balance
Use : Get the current wallet balance of a virtual account number
Call Method: GET
URL : host/zainbox/virtual-account/wallet/balance/{accountNumber}
Sandbox Query : https://sandbox.zainpay.ng/virtual-account/wallet/balance/7965332109
Live Query : https://api.zainpay.ng/virtual-account/wallet/balance/7965332109
Parameter : accountNumber (required)

JSON Response

      

{"code": "00",
  "data":
  {
  "accountName": "Aminu Nasar Adam", 
  "accountNumber": "7966884043", 
  "balanceAmount": 372555, 
  "transactionDate": "2021-10-13T13:45:52" 
  }
  , 
  "description": "successful",
  "status": "Success" 
}             
           
      

       
Update Virtual Account Status
Use : Activate or deactivate virtual account
Call Method: PATCH
URL : host/virtual-account/change/account/status
Sandbox Query : https://sandbox.zainpay.ng/virtual-account/change/account/status
Live Query : https://api.zainpay.ng/virtual-account/change/account/status
Parameter :

Request Payload
MethodPATCH

      

{
    "zainboxCode": "THbfnDvK5o", 
    "accountNumber": "7963799062", 
    "status": true 
}                 
           
      

       
NOTE: Setting the status field to true will activate the virtual account, while setting it to false will deactivate it.

 Important Note
A deactivated virtual account will not be able to receive or transfer funds

Successful JSON Response

      

{
    "code": "00",
    "description": "Successfully Updated Account",
    "status": "success"
}                  
           
      

       
Failed JSON Response

      

{
    "code": "04",
    "description": "Failed to Update Account",
    "status": "Failed"
}     
      

       
Virtual Account Transactions
USE: Get all transactions of an account
Call Method: GET
URL : host/zainbox/virtual-account/wallet/transactions/{accountNumber}
Sandbox Query : https://sandbox.zainpay.ng/virtual-account/wallet/transactions/7965332109
Live Query : https://api.zainpay.ng/virtual-account/wallet/transactions/7965332109
Parameter : accountNumber (required)

JSON Response

      

{
"code": "00",
"data": 
[
{
    "accountNumber": "7966884043",
    "destinationAccountNumber": "2000002105",
    "amount": 7289,
    "balance": 379844,
    "narration": "",
    "transactionDate": "2021-10-13T13:41:39",
    "transactionRef": "",
    "transactionType": "transfer"
},
{
    "accountNumber": "7966884043",
    "destinationAccountNumber": "1234567890",
    "amount": 7289,
    "balance": 372555,
    "narration": "",
    "transactionDate": "2021-10-13T13:45:52",
    "transactionRef": "",
    "transactionType": "transfer"
}
],
    "description": "successful",
    "status": "Success"
}               
           
      

       
Get Bank List
USE: Get the list of available banks.
Call Method: GET
URL : host/zainbox/bank/list
Sandbox Query : https://sandbox.zainpay.ng/bank/list
Live Query : https://api.zainpay.ng/bank/list
Parameter:

JSON Response

      

{
  "code": "00",
  "data": [
    {
      "code": "120001",
      "name": "9PAYMENT SERVICE BANK"
    },
    {
      "code": "090270",
      "name": "AB MICROFINANCE BANK"
    },
    {
      "code": "070010",
      "name": "ABBEY MORTGAGE BANK"
    }
    ],
  "description": "Bank list",
  "status": "Success"
}      
           
      

       
Name Enquiry
USE: Use the bankCode acquired from the get bank list to validate a bank account number.
Call Method: GET
URL : host/zainbox/bank/name-enquiry?{bankCode}&{accountNumber}
Sandbox Query : https://sandbox.zainpay.ng/bank/name-enquiry?bankCode=000013&accountNumber=0011242735
Live Query : https://api.zainpay.ng/bank/name-enquiry?bankCode=000013&accountNumber=0011242735
Parameter: bankCode(Required), accountNumber(Required)

JSON Response

      

{
    "code": "00",
    "data": {
        "accountName": "Nura Aminu Muhammad",
        "accountNumber": "004532112",
        "bankCode": "000014",
        "bankName": "ACCESS BANK"
    },
    "description": "successful",
    "status": "Success"
}                          
           
      

       
Funds Transfer
USE: Fund transfers can be made in the following ways:


Transferring money from one wallet to another



Make a bank account transfer from your wallet

Zainpay infers your fund transfer type, so you don't have to specify it. The charges for each form of transfer are different. This charge can be obtained through your commercials.

Call Method: POST
URL : host/zainbox/bank/transfer/v2
Sandbox Query : https://sandbox.zainpay.ng/bank/transfer/v2
Live Query : https://api.zainpay.ng/bank/transfer/v2

 Important Note
The amount in the JSON request should be converted to kobo decimalization. It is expected that neither float nor double values will be utilized in this case.

Request Payload
MethodPOST

      

{
    "destinationAccountNumber": "0012121252",
    "destinationBankCode": "000005",
    "amount": "2500",
    "sourceAccountNumber": "7965540126",
    "sourceBankCode": "0013",
    "zainboxCode": "13934_rgwUtC",
    "txnRef": "1119809090831300508190108",
    "narration": "kano street",
    "callbackUrl": "https://xainapp.com"
}              
           
      

       
JSON Success Response

      

{
  "code": "200 OK",
  "data": {
  "amount": "1000",
  "callBackUrl": "https://xainapp.com",
  "destinationAccountName": "IDRIS KABIR",
  "destinationAccountNumber": "0012121252",
  "destinationBankCode": "000005",
  "narration": "kano street",
  "paymentRef": "NIPMINI/46643/Payment from Betastack",
  "sourceAccountNumber": "7965540126",
  "sourceBankAccountName": "wemaBank",
  "sourceBankCode": "0013",
  "status": "success",
  "totalTxnAmount": "1100",
  "txnFee": "100",
  "txnRef": "1119809090831300508190108",
  "zainboxCode": "13934_rgwUtC"
  },
  "description": "Funds Transfer Successful ",
  "status": "200 OK"
}         
           
      

       
JSON Failure Response

      

{
  "code": "500 Bad gateway",
  "data": {
  "amount": "1000",
  "callBackUrl": "https://xainapp.com",
  "failureReason": "destination bank not responding",
  "destinationAccountNumber": "0012121252",
  "destinationBankCode": "000005",
  "narration": "kano street",
  "status": "failed",
  "txnRef": "1119809090831300508190108",
  "zainboxCode": "13934_rgwUtC"
  },
  "description": "Funds Transfer Failed! ",
  "status": "500 Bad gateway"
}        
           
      

       
Transfer Verification
USE: The endpoint can be used to verify a posted transfer by its txnRef acquired after successful Funds Transfer
Call Method: GET
URL : host/virtual-account/wallet/transaction/verify/{txnRef}
Sandbox Query : https://sandbox.zainpay.ng/virtual-account/wallet/transaction/verify/svxgdtyGDHt67
Live Query : https://api.zainpay.ng/virtual-account/wallet/transaction/verify/hJDHtyr8874
Parameter: txnRef (Required)

JSON Response for valid transaction

      

{
	"code": "00",
	"data": {
		"amount": "29500",
		"destinationAccountNumber": "0139900794",
		"destinationBankCode": "000018",
		"narration": " launch for devs",
		"paymentRef": "3341110202_999999240902123233374094734063",
		"sourceAccountNumber": "7966349147",
		"txnDate": "2024-09-02T12:31:49",
		"txnRef": "11131300503180079",
		"txnStatus": "success"
	},
	"description": "successful",
	"status": "200 OK"
}       
      

       
JSON Response for invalid transaction

      


{
	"code": "04",
	"description": "Txn not found",
	"status": "Failed"
}                 
           
      

       
Deposit Verification
USE: The endpoint can be used to verify a funds deposit notification received via our Deposit WebHook notification event
Call Method: GET
URL : host/virtual-account/wallet/deposit/verify/v2/{txnRef}
Sandbox Query : https://sandbox.zainpay.ng/virtual-account/wallet/deposit/verify/v2/{txnRef}
Live Query : https://api.zainpay.ng/virtual-account/wallet/deposit/verify/v2/{txnRef}
Parameter: txnRef(required). The txnRef sent in the webhoook notificatoin payload.

JSON Response for valid reference

      

{
"code": "00",
"data": {
"amountAfterCharges": 3692500,
"bankName": "WEMA BANK",
"beneficiaryAccountName": "7961644804",
"beneficiaryAccountNumber": "7961644804",
"narration": "Registration fees",
"paymentDate": "2024-11-01T18:06:15.674293",
"paymentRef": "JNJQyYBBtPqO4IX2jbro",
"sender": "7964673997",
"senderName": "7964673997",
"txnDate": "2024-11-01T18:06:15.674135",
"txnRef": "ACK_202411011706134459",
"txnType": "deposit",
"zainboxCode": "Live_RHei952Nk3BiqoBQr3DW",
"zainboxName": "Live"
},
"description": "successful",
"status": "200 OK"
}            
           
      

       
JSON Response for invalid reference

      


{
	"code": "04",
	"description": "Txn not found",
	"status": "Failed"
}                 
           
      

       
Merchant Transactions
USE: Get the list of first 50 transactions of a merchant
Call Method: GET
URL : host/zainbox/transactions?count=10
Sandbox Query : https://sandbox.zainpay.ng/zainbox/transactions?count=10
Live Query : https://api.zainpay.ng/zainbox/transactions?count=10
Parameter: count is an optional parameter with a default value of 20

JSON Response

      

{
"code": "00",
"data": 
  [
   {
    "accountNumber": "7964524199",
    "amount": 45000,
    "balance": 45000,
    "narration": "",
    "transactionDate": "2021-12-28T11:47:45",
    "transactionRef": "",
    "transactionType": "deposit"
   },
   {
    "accountNumber": "7964524199",
    "amount": 923000,
    "balance": 968000,
    "narration": "",
    "transactionDate": "2021-12-28T11:48:35",
    "transactionRef": "",
    "transactionType": "deposit"
    }
  ],
"description": "successful",
"status": "Success"
}             
           
      

       
Bank Deposit Reconciliation
USE: This endpoint helps our merchant repush all hanging deposits made in a virtual account.
Call Method: GET
URL : host/virtual-account/wallet/transaction/reconcile/bank-deposit
Sandbox Query : https://sandbox.zainpay.ng/virtual- account/wallet/transaction/reconcile/bank-deposit
Live Query : https://api.zainpay.ng/virtual-account/wallet/transaction/reconcile/bank- deposit
Parameter: sessionId, verificationType, bankType, accountNumber

Note:
1. The values of verificationType can only be anyone of depositReferenceNumber or depositAccountNumber
2. sessionId is required when verificationType = depositReferenceNumber, also accountNumber , verificationType , bankType are all required

JSON Response

      

{
"code": "00",
"data": {
"amount": {
"amount": 44300.000
},
"bankName": "000017",
"beneficiaryAccountName": "Zainpay",
"beneficiaryAccountNumber": "4427686982",
"narration": "any bba",
"paymentDate": "2023-11-28T10:20:23.546817",
"paymentRef": "000017231128997",
"sender": "Zainpay",
"senderName": "Zainpay",
"txnDate": "2023-11-28T10:20:20.105073","txnRef": "20231128091119552",
"txnType": "deposit",
"zainboxCode": "0UW8e14g4xJxmxMbHkMy"
},
"description": "successful",
"status": "200 OK"
}          
           
      

       
Error Response

      


{
"code": "20",
"description": "Deposit not verified, please try again",
"status": "502 Bad Gateway"
}             
           
      

       
Create Dynamic Virtual Account (DVA)
Create a temporary virtual account for a specific transaction. The account is valid for the specified duration, and funds received are automatically settled into the merchant's Internal Settlement Account (ISA) tied to the Zainbox used.
Note: Amount must be in kobo. Duration must be between 300 seconds (5 minutes) and 72 hours. Account Name is fixed as "Zainpay Checkout".
Call Method: POST
Live Query: https://api.zainpay.ng/virtual-account/dynamic/create/request
Sandbox Query: https://sandbox.zainpay.ng/virtual-account/dynamic/create/request
Required Parameters: bankType, email, amount, zainboxCode, txnRef, duration, accountName, callBackUrl

Request Payload
MethodPOST

        

{
  "bankType": "gtBank",
  "email": "august@gmail.com",
  "amount": "50000",
  "zainboxCode": "20457_PdciM7SQFHc8f49EmAfy",
  "txnRef": "3734570194110645420356961",
  "duration": 120,
  "accountName": "Zainpay Checkout",
  "callBackUrl": "https://webhook.site/91a56ae3-6c54-4961-a6d3-a4e37aced7c9"
}
        

      
Successful Response

        

{
  "code": "00",
  "data": {
    "accountName": "Betastack Technology LTD",
    "accountNumber": "8183854198",
    "amount": "50000",
    "bankName": "gtBank",
    "duration": 120,
    "email": "august@gmail.com",
    "paymentStatus": "pending",
    "totalAmount": "55500",
    "txnFee": "5500",
    "txnRef": "3734570194110645420356961"
  },
  "description": "successful",
  "status": "200 OK"
}
        

      
Parameter Descriptions
Parameter	Type	Required	Description
bankType	String	Yes	Bank code (e.g., gtBank)
email	String	Yes	Customer email address
amount	Integer	Yes	Amount in kobo
zainboxCode	String	Yes	Zainbox code tied to merchant
txnRef	String	Yes	Unique transaction reference
duration	Integer	Yes	Validity period in seconds (300 to 259200)
accountName	String	Yes	Fixed as Zainpay Checkout
callBackUrl	String	Yes	Webhook URL for notifications
Special Rules
Amount must be in kobo.
Duration must be between 300 seconds (5 minutes) and 72 hours.
Account Name is fixed as "Zainpay Checkout".
There are four possible payment statuses of a dynamic virtual account stated in the table below:
Payment Status Definitions
SN	Status	Description
1	pending	This is the first status of a DVA when its initiated
2	success	This is the status when the expected amount is deposited within the live time of the DVA
3	mismatch	This is the status when the amount deposited is higher or lower than the expected amount. Note: mismatched amounts are automatically refunded to the depositor.
4	expired	This is the status when deposits are made while the DVA lifetime has expired. Note: any amount transfers to an expired DVA will be automatically refunded.
Important Notes
Mismatched deposit notifications are sent via webhook to the provided callBackUrl.
Successful deposits are settled into the Internal Settlement Account (ISA) tied to the Zainbox used.
Note: Mismatched amounts are automatically refunded to the depositor.
Note: Any amount transfers to an expired DVA will be automatically refunded.
Simulate Payment
Call Method: POST
Sandbox Query: https://sandbox-api-d.squadco.com/virtual-account/simulate/payment
Bearer Token: sandbox_sk_1c9f9593643d8fb24482711ec30bb8169f534a45bd87
Required Parameters: virtual_account_number, amount, dva

Simulate Payment Request Payload
MethodPOST

        

{
  "virtual_account_number": "3659723853",
  "amount": "101",
  "dva": true
}
        

      
Simulate Payment Successful Response

        

{
  "status": 200,
  "success": true,
  "message": "Success",
  "data": "Payment successful"
}
        

      
Simulate Payment Parameter Descriptions
Parameter	Type	Required	Description
virtual_account_number	String	Yes	The dynamic virtual account number created from the Create DVA endpoint. This is the unique identifier for the virtual account where the transaction will be processed. Example: "3659723853"
amount	String	Yes	The transaction amount in Naira (₦). Example: "101" means ₦101
dva	Boolean	Yes	Boolean value indicating if the payment is for a dynamic virtual account (true or false)
DVA Transaction Status Query (TSQ)
Use the following endpoint to check the status of your DVA payment:

Call Method: GET
Live Query: https://api.zainpay.ng/virtual-account/dynamic/deposit/status/{txnRef}
Sandbox Query: https://sandbox.zainpay.ng/virtual-account/dynamic/deposit/status/{txnRef}
Where txnRef is the reference used when creating the DVA.

DVA Status Query Response

        

{
  "code": "200 OK",
  "data": {
    "accountName": "Zainpay Checkout",
    "accountNumber": "8183854198",
    "amount": "80000",
    "bankType": "gtBank",
    "callBackUrl": "https://webhook.site/8e878f96-c649-479e-a511-31604e7a53da",
    "createdDate": "2025-08-15T14:29:01.566421",
    "duration": 69,
    "email": "july@gmail.com",
    "status": "pending",
    "timeToLive": 51,
    "totalTxnAmount": "81200",
    "txnFee": "1200",
    "txnRef": "37345707331155454103469161",
    "zainboxCode": "THbfnDvK5o"
  },
  "description": "",
  "status": "200 OK"
}
        

      
TSQ Response Parameters
Parameter	Type	Description
accountName	String	Virtual account name
accountNumber	String	Generated virtual account number
amount	String	Expected amount in kobo
bankType	String	Bank code used
callBackUrl	String	Webhook URL for notifications
createdDate	String	ISO timestamp when DVA was created
duration	Integer	Total duration in seconds
email	String	Customer email address
status	String	Current payment status (pending, success, mismatch, expired)
timeToLive	Integer	Remaining time in seconds before expiry
totalTxnAmount	String	Total amount including fees in kobo
txnFee	String	Transaction fee in kobo
txnRef	String	Unique transaction reference
zainboxCode	String	Zainbox code used for the transaction
Error Responses
Code	HTTP Status	Description
01	400	Invalid request payload or missing required field
02	400	Invalid bank type
03	400	Duration out of allowed range
401	401	Unauthorized — missing or invalid API key
500	500	Internal server error    
Initialize Payment
The Initialize Payment endpoint in Zainpay enables businesses and developers to initiate card payments seamlessly. This endpoint generates a unique payment URL that users can be redirected to in order to complete their transactions securely. It supports both sandbox and live environments, making it easy for merchants to test and implement the payment process before going live.

With this API, businesses can facilitate one-time and recurring payments, ensuring a smooth and efficient checkout experience. The request payload requires essential parameters such as amount, transaction reference (txnRef), mobile number, email address, and Zainbox Code, along with an optional callback URL for post-payment processing. Additionally, a custom logo URL can be provided to personalize the payment page. Card payment initialization in Zainpay is divided into two methods:

Redirect
InlineJS
Request Payload
MethodPOST

      

axios.post('https://api.zainpay.ng/v1/merchant/initialize/payment', {
      headers: {
        'Authorization': `Bearer {public_key}`,
      },
      data: {
        amount: "1000",
        txnRef: "unique_transaction_reference",
        mobileNumber: "08012345678",
        emailAddress: "customer@example.com",
        zainboxCode: "ZBX_123456789",
        callbackUrl: "https://yourwebsite.com/callback",
        logoUrl: "https://yourwebsite.com/logo.png"
      }
})                
           
      

       
Redirect Payment
USE: This endpoint is used to initialiaze card payments.
The data field of the response returned is a url which you can redirect your users to visit and make the payment.
URL : host/zainpay.ng/zainbox/card/initialize/payment
Sandbox Query : https://sandbox.zainpay.ng/zainbox/card/initialize/payment
Live Query : https://api.zainpay.ng/zainbox/card/initialize/payment
Parameter : email, amount, txnRef (unique per each request), mobileNumber, zainboxCode, emailAddress and callBackUrl.
Optional Payload Properties: emailAddress, mobileNumber, callBackUrl, allowRecurringPayment, logoUrl,
Valid Image Types: The logoUrl parameter must point to a valid image URL with one of the following formats: jpg, jpeg, png, gif, bmp, webp, svg, tiff, ico
Notes:
The amount parameter should be in Naira(N), but the amount in our webhook notification payload will be in kobo.
If logoUrl is not provided or the URL is invalid, the default Zainpay logo will be displayed. Ensure that the image URL is publicly accessible to avoid display issues on the payment page.

Request Payload
MethodPOST

      

{
    "amount": "767.75",
    "txnRef": "1wswqdferS66rgOdfwefghGr",
    "mobileNumber": "08068869698",
    "zainboxCode": "0UW8e14g4xJxmxMbHkMy",
    "emailAddress": "info@betastack.ng",
    "callBackUrl": "https://google.com?app=12345¶m=kosa",
    "allowRecurringPayment": true,
    "currencyCode": "NGN",
    "logoUrl": "https://picsum.photos/200/300.jpg"
}                 
           
      

       
JSON Response

      

{
"code": "00",
"data":
"https://dev.zainpay.ng/merchant/redirect-payment?e=V5fvxGjb8wwLvOPZXYyaNMlVZSDrkAdv4ne
19X7uiCdqu0kNOOAkMcjbGjApMcivvyLb4vj4azuusyWqC87vtME5n1psVTXai0pIdH61aTdrWJhQF
CuYV3a7xJSWiNdDndxh2zNQNl74l2gUpQwhniASWarYUXLl2soyAUAkeAPJ1pUPlTmZddNiYqzgS
MhoO1T4OMWk",
"description": "card processing initialization",
"status": "200 OK"
}              
           
      

       
Get Card Payment Status
USE: This endpoint is used to retrieve initiated payment status
Call Method: GET
URL : host/virtual-account/wallet/deposit/verify/{txnRef}
Sandbox Query : https://sandbox.zainpay.ng/virtual-account/wallet/deposit/verify/{txnRef}
Live Query : https://api.zainpay.ng/virtual-account/wallet/deposit/verify/{txnRef}
Parameter: txnRef(required) -The unique transaction reference you passed during payment initialization

Successful JSON Response

      

{
"code": "00",
"data": {
  "amount": {
    "amount": 100
  },
  "bankName": "",
  "beneficiaryAccountName": "4427505285",
  "beneficiaryAccountNumber": "4427505285",
  "narration": "Approved by Financial Institution",
  "paymentDate": "2022-08-09T15:56:01.686777",
  "paymentRef": "Z9I8XkNRta1hq2dlmMzlhwQ9F60dLw",
  "sender": "Zainpay Card",
  "senderName": "Zainpay Card",
  "txnDate": "2022-08-09T15:56:01.685982",
  "txnRef": "Q6166237864",
  "txnType": "deposit",
  "zainboxCode": "THbfnDvK5o"
},
"description": "successful",
"status": "200 OK"
}                 
           
      

       
Failure/Not Found JSON Response

      

{
"code": "04",
"description": "Txn not found",
"status": "400 Bad Request"
}            
           
      

       
NOTE: The above response can also be returned if the payment is still pending or if it has failed.

Card Payment Transaction Reconciliation
USE: This endpoint enables merchants to repush any hanging card payment.
Call Method: GET
URL : http://host./virtual-account/wallet/transaction/reconcile/card- payment?txnRef=1wswwheeyyxwyyuudekka
Sandbox Query : http://sandbox.zainpay.ng./virtual- account/wallet/transaction/reconcile/card-payment?txnRef=1wswwheeyyxwyyuudekka
Live Query : http://api.zainpay.ng./virtual-account/wallet/transaction/reconcile/card- payment?txnRef=1wswwheeyyxwyyuudekka
Parameter: txnRef

Note:
txnRef is required

JSON Response

      

{
"code": "00",
{
"code": "00",
"data": {
"paymentRef": "EcDthbQmOdYJkns6IUUxPyqnCrhuLH",
"txnDate": "2023-11-28T13:26:56",
"txnRef": "1wswwheeyyxwyyuudekka",
"txnStatus": "success"
},
"description": "Transaction successful",
"status": "200 OK"
}     
           
      

       
Error Response

      


{
"code": "04",
"description": "Invalid txnRef",
"status": "400 Bad Request"
}          
           
      

       
InlineJS
Zainpay InlineJS offers a seamless way to integrate card payments into your web application. This section covers how to implement the InlineJS payment modal for processing card transactions.
URL: host/js/inline
Sandbox Script: https://dev.zainpay.ng/v1/zainpay-inline.js
Live Script: https://api.zainpay.ng/v1/zainpay-inline.js
Required Parameters: amount, txnRef, zainboxCode, emailAddress
Optional Parameters: mobileNumber, callBackUrl, allowRecurringPayment, logoUrl, currencyCode

Installation

      

        Add this script to your HTML file:
        <script src="https://dev.zainpay.ng/v1/zainpay-inline.js"></script>
      

      
Configuration Example
MethodJS

      

        // Configure payment details
        const paymentConfig = {
          amount: "500.00", // Total amount for payment
          txnRef: generateUniqueRef(), // Generate unique transaction reference
          mobileNumber: "08012345678",
          zainboxCode: "YOUR_ZAINBOX_CODE",
          emailAddress: "customer@example.com",
          callBackUrl: "https://your-website.com/callback",
          allowRecurringPayment: false,
          currencyCode: "NGN", // Currency (default: "NGN")
          logoUrl: "https://your-website.com/logo.png" // Optional: your logo for the payment modal
        };

        // Public key (sandbox or live)
        const PUBLIC_KEY = "your_zainpay_public_key";
      

      
Implementation Example
MethodJS

      

        // Initiate payment
        function initiatePayment() {
          zainpayInitPayment(paymentConfig, handleCallback, PUBLIC_KEY);
        }

        // Handle the callback after payment response
        function handleCallback(response) {
          switch(response.status) {
            case "success":
              // Handle successful payment (e.g., show success message)
              break;
            case "failed":
              // Handle failed payment (e.g., show failure message)
              break;
            case "cancelled":
              // Handle cancelled payment (e.g., show cancelled message)
              break;
          }
        }
      

      
Parameter Descriptions
Parameter	Type	Required	Description
amount	String	Yes	Payment amount in Naira (e.g., "500.50")
txnRef	String	Yes	Unique transaction reference for each payment
zainboxCode	String	Yes	Your Zainbox merchant identifier
emailAddress	String	Yes	Customer's email address
mobileNumber	String	No	Customer's phone number
callBackUrl	String	No	URL to receive payment notification
allowRecurringPayment	Boolean	No	Enable/disable recurring payments
logoUrl	String	No	Custom logo URL for payment modal
currencyCode	String	No	Payment currency (default: "NGN")
Test Cards
The following cards can be used in the sandbox to make payments.
5060990 5800 0021 7499

Expiry Date: 03/50CVV: 111



PIN: 1111OTP: 123456

4000 0000 0000 2503

Expiry Date: 03/50CVV: 111



PIN: 1111OTP: 1234

5399 2370 3725 2182

Expiry Date: 07/23CVV: 250



PIN: 4321OTP: 123456

Acceptable Cards

Card Tokenization
The Tokenization feature in Zainpay is designed to enhance the security and convenience of recurring card payments. With tokenization, merchants can generate a unique token for a user's card to store it securely. This token can then be used for subsequent transactions without requiring the cardholder to provide their card details repeatedly. This will not only simplify the payment process but also ensures the confidentiality of sensitive card information.

Benefits of Tokenization
Enhanced Security
Tokenization reduces the risk of exposing sensitive card information during transactions, as merchants do not need to store actual card details.

Convenience for Users
Cardholders do not have to repeatedly enter their card details for recurring payments, streamlining the payment process.

Reduced PCI Compliance Scope
Since merchants handle fewer sensitive card details, the scope of PCI DSS (Payment Card Industry Data Security Standard) compliance is reduced.

Efficient Recurring Payments
Simplifies the handling of recurring payments, making it more efficient for both merchants and users.

How it Works
1. Recurrent Payment Handling
Simplifies the handling of recurring payments, making it more efficient for both merchants and users.

              

                

{
  "amount": "100",
  "txnRef" : "Q6166237864",
  "mobileNumber": "08000000000",
  "zainboxCode": "THbfnDvK5o",
  "emailAddress": "info@test.com",
  "callBackUrl" : "https://example.com/webhook/zainpay",
  "allowRecurringPayment" : true
}          
            
                    

                

            
2. Secure Card
After payment has been made, a token is sent to the merchant in the deposit notification payload labelled cardToken. Subsequently, the merchant can use that token to make recurring payments against the card that was used to make the initial payment. The token is a securely generated alphanumeric string that represents the user's card details without exposing the actual sensitive information. Below is the deposit notification webhook sample;

              

                

{
  "data": {
  "depositedAmount": "100000",
  "txnChargesAmount": "6400",
  "amountAfterCharges": "93600",
  "bankName": "ZainMFB",
  "beneficiaryAccountName": "idris",
  "beneficiaryAccountNumber": "7964524199",
  "narration": "gift",
  "paymentDate": "2021-12-28T11:48:35.044886444",
  "paymentRef": "a1oA0ws127quism",
  "sender": "900989098",
  "senderName": "hassan ",
  "txnDate": "2021-12-28T11:48:35.044777507",
  "txnRef": "730003356",
  "txnType": "deposit",
  "zainboxCode": "xmaldoaYnakaAAVOAE",
  "callBackUrl": "https://example.com/webhook/zainpay ",
  "emailNotification": "user@user.com",
  "zainboxName": "users",
  "cardToken" : "oiuytretyguhjkjhGFDSERDTYUITYER34567890IUYDFGHi789"
  },
  "event": "deposit.success"
}    
                        
                    

                

            
3. Recurrent card purchases endpoints
URL : host/zainbox/list
Sandbox Query : https://sandbox.zainpay.ng/zainbox/card/recurring/purchase
Live Query : https://api.zainpay.ng/zainbox/card/recurring/purchase

Request Payload
MethodPOST

      


{
  "amount": "100",
  "txnRef" : "Q6166237864",
  "mobileNumber": "08000000000",
  "zainboxCode": "THbfnDvK5o",
  "emailAddress": "info@test.com",
  "callBackUrl" : "https://example.net/webhook/zainpay",
  "cardToken" : "oiuytretyguhjkjhGFDSERDTYUITYER34567890IUYDFGHi789"
}              
           
      

       
Successful JSON Response

      


{
  "code": "00",
  "data": {
  "amount": "500",
  "callBackUrl": "https://example.com/webhook/zainpay ",
  "emailAddress": "user@gmail.com",
  "txnRef": "P234567891_0802"
  },
  "description": "card payment successful",
  "status": "200 OK"
}        
           
      

       
Conclusion
Zainpay's Tokenization feature is a powerful tool for merchants to enhance the security and efficiency of recurring card payments. By following the outlined guidelines, merchants can seamlessly integrate this feature into their systems, providing a secure and convenient payment experience for both the users and the businesses.

Webhooks/ Event Notifications
At Zainpay, listening to events notifications is not optional; as a lot of process statuses are pushed to your integration via this.

Listening to events
All triggered events will be posted per zainbox(as JSON Objects), be careful and ensure that your configured callback URL for a zainbox doesn't need any form of authentication or authorization, because of this, it's very important that you verify every event sent to avoid providing value to fake/counterfeit events. When an event is sent, it comes with a custom header called ```Zainpay-Signature``` which is an encrypted value of your payload using ```HmacSHA256``` and signed with your secret key.
An example of the header looks this way


      

```
Host: api.zainpay.ng
Cache-Control: no-cache
Zainpay-Signature: ec22e8478242a64c0cb9130f0f37b8090bda2a2681a5aab34dd01d0e97e291a061
User-Agent: api.zainpay.ng/1.0
Content-Type: application/json
```                      
           
      

       
Transfer
An event is pushed to the callback URL of every zainbox when funds are transferred to any of it's virtual account numbers. The payload structure is given below.

Successful Transfer Event

      

```
Host: api.zainpay.ng
Cache-Control: no-cache
Zainpay-Signature: ec22e8478242a64c0cb9130f0f37b8090bda2a2681a5aab34dd01d0e97e291a061
User-Agent: api.zainpay.ng/1.0
Content-Type: application/json
```

{
  "data": {
    "accountNumber": "7964182836",
    "amount": {
      "amount": 2100
    },
    "beneficiaryAccountNumber": "7964182836",
    "beneficiaryBankCode": "0013",
    "narration": "me and you",
    "paymentRef": "bOQtDmSgmiaZpXC6PiAR",
    "txnDate": "2022-01-05T12:43:35.291042627",
    "txnRef": "1q3311s",
    "txnType": "transfer", 
    “zainboxCode”: “xmaldoaYnakaAAVOAE”
  },
  "event": "transfer.success"
}                  
           
      

       
Failed Transfer Event

      

```
Host: api.zainpay.ng
Cache-Control: no-cache
Zainpay-Signature: ec22e8478242a64c0cb9130f0f37b8090bda2a2681a5aab34dd01d0e97e291a061
User-Agent: api.zainpay.ng/1.0
Content-Type: application/json
```

{
  "data": {
  "accountNumber": "98765445677",
  "amount": {
  "amount": 120987667
  },
  "beneficiaryAccountName": "",
  "beneficiaryAccountNumber": "9808787787",
  "beneficiaryBankCode": "000001",
  "internalTxnRef": "RTYUYT5TTS876567SS",
  "txnDate": "2024-09-28T12:50:27.13380995",
  "txnType": "transfer",
  "zainboxCode": "17621_WWWUYTY2I8znFsYbq"
  },
  "event": "transfer.failed"
}
    
           
      

       
Deposit
An event is pushed to the callback URL of every zainbox when its account number receives a deposit transaction. Here is the payload structure

Note
We have updated the deposit event payload for all new Zainboxes, and Zainboxes created before 13th February can be easily upgraded to the new version,
which has the following Deposit event payload. If you would like to upgrade, please contact our support channels, and we will be more than happy to assist you.

The updated version emphasizes the availability of the new deposit event payload and the ease with which users can upgrade to it.

Deposit Event

      

{
  "data": {
    "depositedAmount": "100000",
    "txnChargesAmount": "6400",
    "amountAfterCharges": "93600",
    "bankName": "ZainMFB",
    "beneficiaryAccountName": "idris",
    "beneficiaryAccountNumber": "7964524199",
    "narration": "gift",
    "paymentDate": "2021-12-28T11:48:35.044886444",
    "paymentRef": "a1oA0ws127quism",
    "sender": "900989098",
    "senderName": "hassan ",
    "txnDate": "2021-12-28T11:48:35.044777507",
    "txnRef": "730003356",
    "txnType": "deposit",
    "zainboxCode": "xmaldoaYnakaAAVOAE",
    "callBackUrl": "http://gofundme.ng/webhook",
    "emailNotification": "user@user.com",
    "zainboxName": "users",
    
  },
  "event": "deposit.success"
}                 
           
      
Application Status Codes
Status Code	Description	Category	Status Type
00	Successful	General	Status
20	Invalid source Account Number or ZainboxCode	Funds Transfer	Error
21	Successful Queued Transaction	Funds Transfer	Status
22	Payload validation Error	General	Error
23	Insufficient wallet balance	Funds Transfer	Error
24	Invalid Destination account number	Funds Transfer	Error
25	This account have no wallet balance	Funds Transfer	Error
26	Duplicate transaction ref number	Funds Transfer	Error
27	Fundss transfer Application Error	Funds Transfer	Error
28	Inactive virtual account	Funds Transfer	Status
29	Application Failure	General	Error
30	Billing Estimation Error during fund transfer	Funds Transfer	Error

