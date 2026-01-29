import { handlers } from '@/src/lib/auth';

// Force Node.js runtime (required for bcrypt in auth)
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
