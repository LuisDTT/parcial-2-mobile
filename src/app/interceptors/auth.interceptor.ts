import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const isExternalApi = req.url.includes(
      'ravishing-courtesy-production.up.railway.app',
    );

    if (isExternalApi) {
      const externalToken = localStorage.getItem('externalApiToken');
      console.log(externalToken);
      if (externalToken) {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `${externalToken}`,
          },
        });
        return next.handle(cloned);
      } else {
        return next.handle(req);
      }
    }

    // Para otras rutas, usamos el token del AuthService (por ejemplo, Firebase)
    return from(this.authService.getToken()).pipe(
      switchMap((token) => {
        if (token) {
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next.handle(cloned);
        }
        return next.handle(req);
      }),
    );
  }
}
