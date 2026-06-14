// interceptors/auth-interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    // Clonamos la petición y le agregamos el header Authorization
    const reqConToken = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(reqConToken);
  }

  return next(req);
};