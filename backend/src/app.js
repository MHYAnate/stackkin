// ... existing imports ...
import analyticsJob from './jobs/analytics.job.js'; './jobs/analytics.job.js';
import advertisementJob from './jobs/advertisement.job.js';
import { adTrackingMiddleware } from './middleware/adTracking.middleware.js';

// ... existing code ...

// Start background jobs
if (process.env.NODE_ENV !== 'test') {
  // ... other jobs ...
  advertisementJob.start();
  analyticsJob.start();
}

// ... rest of the file ...


// ... existing imports ...


// ... existing code ...

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'frame-src': ["'self'", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Ad tracking middleware (add this after cookieParser)
app.use(adTrackingMiddleware);

// ... rest of the file ...