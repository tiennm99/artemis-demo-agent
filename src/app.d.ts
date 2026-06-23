declare global {
  namespace App {
    interface ArtemisUser {
      id: string;
      email: string;
      displayName: string;
      domain: string;
      verifiedEmail: boolean;
      authProvider: 'google';
    }

    interface Locals {
      user: ArtemisUser | null;
    }
  }
}

export {};
