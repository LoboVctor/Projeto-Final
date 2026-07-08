import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../nucleo/config/api.config';

@Component({
  selector: 'app-esqueceu-senha',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './esqueceu-senha.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsqueceuSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  isLoading = signal(false);
  enviado = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.erro.set(null);

    this.http.post(`${this.baseUrl}/autenticacao/esqueceu-senha`, {
      email: this.form.value.email
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.erro.set(
          err.status === 404
            ? 'E-mail não encontrado na plataforma.'
            : 'Ocorreu um erro. Tente novamente.'
        );
      }
    });
  }
}
