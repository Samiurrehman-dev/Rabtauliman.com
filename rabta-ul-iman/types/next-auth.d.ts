import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'donor';
      username?: string;
      phone?: string;
      whatsapp?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'admin' | 'donor';
    username?: string;
    phone?: string;
    whatsapp?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'donor';
    username?: string;
    phone?: string;
    whatsapp?: string;
  }
}
