import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // URL base para o NestJS
  private readonly API_URL = 'http://localhost:3000/api/auth'; 
  private tokenSubject = new BehaviorSubject<string | null>(null);

  login(credentials: { email: string; token_acesso: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        if (response?.token) this.tokenSubject.next(response.token);
      })
    );
  }

  getToken(): string | null { return this.tokenSubject.value; }
  isAuthenticated(): boolean { return this.tokenSubject.value !== null; }
  
  logout(): void {
    this.tokenSubject.next(null);
    this.router.navigate(['/login']);
  }
}