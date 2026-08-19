declare global {
  namespace Express {
    interface User {
      id: string;
      googleSub: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
      isAdmin?: boolean;
    }
  }
}

export {};

