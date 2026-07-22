import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../nucleo/config/api.config';
import { AuthService } from '../../../nucleo/services/auth';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const novaSenha = control.get('novaSenha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  if (novaSenha && confirmarSenha && novaSenha !== confirmarSenha) {
    return { senhasDiferentes: true };
  }
  return null;
}

function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const senha: string = control.value ?? '';
  if (!senha) return null;
  const ok =
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(senha);
  return ok ? null : { senhaFraca: true };
}

@Component({
  selector: 'app-redefinir-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './redefinir-senha.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RedefinirSenhaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);
  readonly authService = inject(AuthService);

  isLoading = signal(false);
  concluido = signal(false);
  erro = signal<string | null>(null);
  token = signal<string | null>(null);
  mostrarNovaSenha = signal(false);
  mostrarConfirmarSenha = signal(false);
  /** Controla a exibição do checklist de requisitos */
  mostrarRequisitos = signal(false);

  /** Modo "primeiro acesso": usuário já está autenticado e precisa trocar a senha obrigatória */
  isPrimeiroAcesso = signal(false);

  form = this.fb.group({
    novaSenha: ['', [Validators.required, Validators.minLength(8), senhaForteValidator]],
    confirmarSenha: ['', [Validators.required]]
  }, { validators: senhasIguaisValidator });

  /** Signal reativo com o valor atual do campo novaSenha */
  senhaAtual = toSignal(this.form.get('novaSenha')!.valueChanges, { initialValue: '' });

  // ── Computed: requisitos individuais ──────────────────────────────────
  reqMinimo    = computed(() => (this.senhaAtual() ?? '').length >= 8);
  reqMaiuscula = computed(() => /[A-Z]/.test(this.senhaAtual() ?? ''));
  reqMinuscula = computed(() => /[a-z]/.test(this.senhaAtual() ?? ''));
  reqNumero    = computed(() => /[0-9]/.test(this.senhaAtual() ?? ''));
  reqEspecial  = computed(() => /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(this.senhaAtual() ?? ''));

  // ── Computed: força geral (0–5) ───────────────────────────────────────
  forcaSenha = computed(() =>
    [this.reqMinimo(), this.reqMaiuscula(), this.reqMinuscula(), this.reqNumero(), this.reqEspecial()]
      .filter(Boolean).length
  );

  labelForca = computed(() => {
    const f = this.forcaSenha();
    if (!(this.senhaAtual() ?? '').length) return '';
    if (f <= 2) return 'Fraca';
    if (f === 3) return 'Média';
    if (f === 4) return 'Boa';
    return 'Forte';
  });

  corForcaBar = computed(() => {
    const f = this.forcaSenha();
    if (f <= 2) return 'bg-red-400';
    if (f === 3) return 'bg-yellow-400';
    if (f === 4) return 'bg-blue-400';
    return 'bg-green-500';
  });

  textCorForca = computed(() => {
    const f = this.forcaSenha();
    if (f <= 2) return 'text-red-500';
    if (f === 3) return 'text-yellow-500';
    if (f === 4) return 'text-blue-500';
    return 'text-green-600';
  });

  ngOnInit(): void {
    const isPrimeiroAcesso = this.router.url.startsWith('/primeiro-acesso');
    this.isPrimeiroAcesso.set(isPrimeiroAcesso);

    if (!isPrimeiroAcesso) {
      const token = this.route.snapshot.queryParamMap.get('token');
      this.token.set(token);
      if (!token) {
        this.erro.set('Token de redefinição inválido ou ausente.');
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    if (!this.isPrimeiroAcesso() && !this.token()) return;

    this.isLoading.set(true);
    this.erro.set(null);

    if (this.isPrimeiroAcesso()) {
      this.authService.trocarSenhaPrimeiroAcesso(this.form.value.novaSenha!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.concluido.set(true);
          setTimeout(() => {
            if (this.authService.isCoordenador()) {
              this.router.navigate(['/coordenador/home']);
            } else {
              this.router.navigate(['/home']);
            }
          }, 2000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.erro.set(
            err.status === 400
              ? err.error?.message || 'Ocorreu um erro. Tente novamente.'
              : 'Ocorreu um erro. Tente novamente.'
          );
        }
      });
    } else {
      this.http.post(`${this.baseUrl}/autenticacao/redefinir-senha`, {
        token: this.token(),
        novaSenha: this.form.value.novaSenha
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.concluido.set(true);
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.erro.set(
            err.status === 400
              ? 'Token expirado ou inválido. Solicite um novo link.'
              : 'Ocorreu um erro. Tente novamente.'
          );
        }
      });
    }
  }

  get senhasDiferentes(): boolean {
    return !!this.form.errors?.['senhasDiferentes'] && !!this.form.get('confirmarSenha')?.touched;
  }

  voltarAoLogin(): void {
    this.authService.logout();
  }
}
