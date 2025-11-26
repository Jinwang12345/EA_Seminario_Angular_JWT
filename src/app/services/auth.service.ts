import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  _id: string;
  username: string;
  gmail: string;
  birthday?: string | Date;
  eventos: string[];
  rol?: string;
}

export interface LoginResponse {
  message: string;
  User: User;
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario y token del localStorage al iniciar
    const saved = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (saved && token) {
      const u: User = JSON.parse(saved);
      this.currentUserSubject.next(u);
    }
  }

  /** LOGIN */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/user/auth/login`, {
      username,
      password
    }).pipe(
      tap(res => {
        console.log('Login response:', res);
        this.setCurrentUser(res.User);
        this.setToken(res.token);
        this.setRefreshToken(res.refreshToken);
      })
    );
  }

  /** REGISTRO */
  register(username: string, gmail: string, password: string, birthday?: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/user/auth/register`, {
      username,
      gmail,
      password,
      birthday
    }).pipe(
      tap(res => {
        console.log('Register response:', res);
        this.setCurrentUser(res.user);
      })
    );
  }

  /** Utilidad para sincronizar estado/localStorage */
  private setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('Usuario guardado en localStorage:', user);
    } else {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(user);
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
    console.log('Token guardado en localStorage');
  }

  private setRefreshToken(refreshToken: string) {
    localStorage.setItem('refreshToken', refreshToken);
    console.log('Refresh token guardado en localStorage');
  }

  /** Obtener token actual */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** Obtener refresh token */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /** Logout - limpia todo */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    console.log('Sesión cerrada');
  }

  /** Obtener usuario actual */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** Verificar si está logueado */
  isLoggedIn(): boolean {
    const user = this.currentUserSubject.value;
    const token = this.getToken();
    return !!(user && token);
  }

  /** Verificar si es administrador */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.rol === 'admin';
  }

  /** Crear usuario admin (solo desarrollo) */
  createAdminUser(): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/auth/create-admin`, {});
  }

  /** Refrescar token de acceso */
  refreshAccessToken(): Observable<{message: string, token: string}> {
    const refreshToken = this.getRefreshToken();
    const user = this.getCurrentUser();
    
    if (!refreshToken || !user) {
      throw new Error('No hay refresh token o usuario');
    }

    return this.http.post<{message: string, token: string}>(
      `${this.apiUrl}/user/auth/refresh`,
      {
        refreshToken,
        userId: user._id
      }
    ).pipe(
      tap(res => {
        this.setToken(res.token);
        console.log('Token refrescado exitosamente');
      })
    );
  }
}