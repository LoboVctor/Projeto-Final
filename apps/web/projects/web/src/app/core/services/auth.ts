import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthResponse {
  access_token: string;
  usuario: any; // O objeto completo que a sua API de login devolve
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  private readonly API_URL = 'http://localhost:3000/api/v1/auth'; 
  
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
  private tokenSubject = new BehaviorSubject<string | null>(this.getInitialToken());
  // Guarda o objeto inteiro do usuário logado
  private usuarioSubject = new BehaviorSubject<any | null>(this.getInitialUser());

  private getInitialToken(): string | null {
    if (isPlatformBrowser(this.platformId)) return localStorage.getItem('access_token');
    return null;
  }

  private getInitialUser(): any | null {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('usuario_logado');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  login(credentials: { email: string; senha: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        const token = response?.access_token;
        const usuario = response?.usuario;
        
        if (token) {
          this.tokenSubject.next(token);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('access_token', token);
          }
        }

        // Salva os dados do usuário logo após o login!
        if (usuario) {
          this.usuarioSubject.next(usuario);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('usuario_logado', JSON.stringify(usuario));
          }
        }
      })
    );
  }

  getToken(): string | null { 
    return this.tokenSubject.value; 
  }
  
  isAuthenticated(): boolean { 
    return this.tokenSubject.value !== null; 
  }

  /**
   * Pega o ID real do Educador!
   */
  getLoggedUserId(): string | null {
    const user = this.usuarioSubject.value;
    
    console.log('Objeto completo do Usuário no Storage:', user);

    if (!user) return null;

    if (user.educador?.id) return user.educador.id; 
    if (user.educadorId) return user.educadorId;   
    if (user.perfil?.id) return user.perfil.id;    
    
    return user.id || null; 
  }

  getLoggedUserName(): string {
    const user = this.usuarioSubject.value;
    if (!user) return 'Usuário';

    // 1. Se for um Educador, mapeia o campo 'nome'
    if (user.educador?.nome) {
      return user.educador.nome;
    }

    // 2. Se for um Responsável, mapeia o campo 'nomeCompleto'
    if (user.responsavel?.nomeCompleto) {
      return user.responsavel.nomeCompleto;
    }

    // Fallback caso não encontre nenhuma das relações populadas
    return 'Usuário';
  }
  
  logout(): void {
    this.tokenSubject.next(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    this.usuarioSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('usuario_logado');
    }
    this.router.navigate(['/login']);
  }
}