export const publicRoutes = ['/', '/login', '/signup'];
export const isPublicRoute = (pathname: string) => publicRoutes.includes(pathname);
