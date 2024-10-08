import { NextResponse } from 'next/server';
import withAuth from './middlewares/withAuth';

export function mainMiddleware() {
  const res = NextResponse.next();
  return res;
}
export default withAuth(mainMiddleware, [
  '/',
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/users',
  '/dashboard/products',
  '/dashboard/settings',
  '/auth/login',
  '/auth/forgot-password',
]);
