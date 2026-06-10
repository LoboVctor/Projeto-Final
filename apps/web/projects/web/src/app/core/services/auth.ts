import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // URL base para o NestJS
  private readonly API_URL = 'http://localhost:3000/api/v1/auth';
  private tokenSubject = new BehaviorSubject<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  );

  login(credentials: { email: string; token_acesso: string }): Observable<{ token: string; usuario: any }> {
    const payload = {
      email: credentials.email,
      senha: credentials.token_acesso
    };

    return this.http.post<{ access_token: string; usuario: any }>(`${this.API_URL}/login`, payload).pipe(
      map(response => {
        const token = response.access_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
        }
        this.tokenSubject.next(token || null);
        return { token, usuario: response.usuario };
      })
    );
  }

  getToken(): string | null { return this.tokenSubject.value; }
  isAuthenticated(): boolean { return this.tokenSubject.value !== null; }
  
  logout(): void {
    this.tokenSubject.next(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    this.router.navigate(['/login']);
  }
}