import createMiddleware from 'next-intl/middleware';
import { routing } from './src/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - api (API routes)
  // - _next (Next.js internals)
  // - . (files with extensions)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
