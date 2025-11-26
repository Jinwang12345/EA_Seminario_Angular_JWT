import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    
    // Si existe token, agregarlo al header Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Solo agregar Content-Type si no hay token
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expirado o inválido
          console.error('Error 401: Token inválido o expirado');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          // Sin permisos suficientes
          console.error('Error 403: No tienes permisos para realizar esta acción');
          alert('⚠️ No tienes permisos de administrador para realizar esta acción');
        } else if (error.status === 404) {
          console.error('Error 404: Recurso no encontrado');
        } else if (error.status === 500) {
          console.error('Error 500: Error interno del servidor');
        }
        
        return throwError(() => error);
      })
    );
  }
}