declare module 'jsonwebtoken' {
  interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
  }

  interface VerifyErrors {
    name: string;
    message: string;
  }

  export function sign(payload: any, secret: string, options?: SignOptions): string;
  export function verify(token: string, secret: string): any;
}
