import { cookies } from 'next/headers';
import { NextFetchEvent, NextMiddleware, NextRequest, NextResponse } from 'next/server';

const authPage = ['/auth/login', '/auth/forgot-password'];

export default function withAuth(middleware: NextMiddleware, requireAuth: string[] = []) {
  return async (req: NextRequest, next: NextFetchEvent) => {
    const pathName = req.nextUrl.pathname;
    const token = cookies().get('access_token')?.value;

    if (requireAuth.includes(pathName)) {
      if (!token && !authPage.includes(pathName)) {
        const url = new URL('/auth/login', req.url);
        // url.searchParams.set("callbackUrl", encodeURI(req.url));
        return NextResponse.redirect(url);
      }

      if (token) {
        if (pathName === '/') {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        if (authPage.includes(pathName)) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }
    }
    return middleware(req, next);
  };
}
