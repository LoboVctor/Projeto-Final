import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';



export interface PerfilResumido {
  id: string;
  nome?: string;
  nomeCompleto?: string;
}

export interface UsuarioLogado {
  id: string;
  email: string;
  role: string;
  escolaId?: string; // Incluindo o escolaId que vem no JWT
  educadorId?: string | null;
  responsavelId?: string | null;
  educador?: PerfilResumido | null;
  responsavel?: PerfilResumido | null;
}

export interface AuthResponse {
  access_token: string;
  usuario: UsuarioLogado;
}



@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = inject(API_BASE_URL);

  private get API_URL(): string {
    return `${this.baseUrl}/autenticacao`;
  }


  private tokenSubject!: BehaviorSubject<string | null>;
  private usuarioSubject!: BehaviorSubject<UsuarioLogado | null>;

  constructor() {
    this.tokenSubject = new BehaviorSubject<string | null>(this.getInitialToken());
    this.usuarioSubject = new BehaviorSubject<UsuarioLogado | null>(this.getInitialUser());
  }

  private getInitialToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getInitialUser(): UsuarioLogado | null {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('usuario_logado');
      return userStr ? (JSON.parse(userStr) as UsuarioLogado) : null;
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
    return !!this.tokenSubject.value;
  }


  /**
   * Retorna o ID do perfil de ação do usuário logado
   * (educadorId tem prioridade sobre responsavelId).
   */
  getLoggedUserId(): string | null {
    const user = this.usuarioSubject.value;
    if (!user) return null;

    if (user.educador?.id) return user.educador.id;
    if (user.educadorId) return user.educadorId;
    if (user.responsavel?.id) return user.responsavel.id;

    return user.id ?? null;
  }

  getRole(): string | null {
    return this.usuarioSubject.value?.role ?? null;
  }

  isCoordenador(): boolean {
    return this.usuarioSubject.value?.role === 'COORDENADOR';
  }

  isProfessor(): boolean {
    const role = this.usuarioSubject.value?.role;
    return role === 'PROFESSOR_REGENTE' || role === 'PROFESSOR_ATENDIMENTO';
  }

  getEscolaId(): string | null {
    const user = this.usuarioSubject.value;
    return user?.escolaId ?? (user?.educador as any)?.escolaId ?? null;
  }

  getLoggedUserName(): string {
    const user = this.usuarioSubject.value;
    if (!user) return 'Usuário';

    if (user.educador?.nome) return user.educador.nome;

    if (user.responsavel?.nomeCompleto) return user.responsavel.nomeCompleto;

    return 'Usuário';
  }

  logout(): void {
    this.tokenSubject.next(null);
    this.usuarioSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('usuario_logado');
    }
    this.router.navigate(['/login']);
  }
}