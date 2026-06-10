import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthResponse {
  access_token: string;
  usuario: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  private readonly API_URL = 'http://localhost:3000/api/v1/auth'; 
  
  // Inicia buscando o token salvo no disco para sobreviver ao F5
  private tokenSubject = new BehaviorSubject<string | null>(this.getInitialToken());

  private getInitialToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  login(credentials: { email: string; senha: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        // Agora lemos a chave exata que o NestJS envia: access_token
        const token = response?.access_token;
        
        if (token) {
          this.tokenSubject.next(token);
          
          if (isPlatformBrowser(this.platformId)) {
            // Guardamos com a chave 'access_token' no Local Storage
            localStorage.setItem('access_token', token);
          }
        }
      })
    );
  }

  getToken(): string | null { return this.tokenSubject.value; }
  
  isAuthenticated(): boolean { return this.tokenSubject.value !== null; }
  
  logout(): void {
    this.tokenSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
    }
    this.router.navigate(['/login']);
  }
}