import { NextResponse } from 'next/server';
import withAuth from './middlewares/withAuth';

export function mainMiddleware() {
  const res = NextResponse.next();
  return res;
}
export default withAuth(mainMiddleware, [
  '/',
  '/dashboard',
  '/dashboard/modules',
  '/dashboard/products',
  '/dashboard/products/create',
  '/dashboard/products/:id/edit',
  '/dashboard/products/brands',
  '/dashboard/products/categories',
  '/dasboard/profile',
  '/dasboard/roles',
  '/dasboard/settings',
  '/dashboard/suppliers',
  '/dashboard/suppliers/create',
  '/dashboard/suppliers/:id/edit',
  '/dashboard/users',
  '/dashboard/users/create',
  '/dashboard/users/:id/edit',
  '/dashboard/warehouses',
  '/auth/login',
  '/auth/forgot-password',
]);
