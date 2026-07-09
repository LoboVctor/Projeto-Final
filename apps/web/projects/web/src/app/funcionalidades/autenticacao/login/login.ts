import { Component, inject, signal , ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../nucleo/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]] });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService
      .login({
        email: this.loginForm.value.email!,
        senha: this.loginForm.value.password! })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          if (this.authService.isCoordenador()) {
            this.router.navigate(['/coordenador/home']);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (err: any) => {
          this.isLoading.set(false);
        } });
  }
}
