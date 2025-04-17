// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      map((user) => {
        if (user) {
          // Si el usuario está autenticado, permitir el acceso
          return true;
        } else {
          // Si no está autenticado, redirigir al login
          this.router.navigate(['/login']);
          return false;
        }
      }),
    );
  }
}
