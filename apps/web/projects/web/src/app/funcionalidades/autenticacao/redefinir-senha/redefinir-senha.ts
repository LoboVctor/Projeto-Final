import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../nucleo/config/api.config';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const novaSenha = control.get('novaSenha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  if (novaSenha && confirmarSenha && novaSenha !== confirmarSenha) {
    return { senhasDiferentes: true };
  }
  return null;
}

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
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

  isLoading = signal(false);
  concluido = signal(false);
  erro = signal<string | null>(null);
  token = signal<string | null>(null);

  form = this.fb.group({
    novaSenha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required]]
  }, { validators: senhasIguaisValidator });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token.set(token);
    if (!token) {
      this.erro.set('Token de redefinição inválido ou ausente.');
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token()) return;

    this.isLoading.set(true);
    this.erro.set(null);

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

  get senhasDiferentes(): boolean {
    return !!this.form.errors?.['senhasDiferentes'] && !!this.form.get('confirmarSenha')?.touched;
  }
}
