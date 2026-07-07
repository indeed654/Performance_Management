import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, AuthResponse, ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // Using signals for reactive auth state
  currentUser = signal<User | null>(this.getUserFromStorage());
  isLoggedIn = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('access_token', res.data.accessToken);
          localStorage.setItem('refresh_token', res.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
        }
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<any> {
    const token = localStorage.getItem('refresh_token');
    return this.http.post<ApiResponse<{ accessToken: string }>>(`${this.apiUrl}/refresh`, { refreshToken: token }).pipe(
      tap(res => {
        if (res.data?.accessToken) {
          localStorage.setItem('access_token', res.data.accessToken);
        }
      }),
      catchError(err => {
        this.clearStorage();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getUserFromStorage(): User | null {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }

  private clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }
}
