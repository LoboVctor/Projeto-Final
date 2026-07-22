import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { CadastroLayoutComponent } from '../../../compartilhado/components/cadastro-layout/cadastro-layout.component';
import { CustomValidators } from '../../../compartilhado/validators/custom-validators';
import { CadastroService } from '../../../compartilhado/services/cadastro.service';
import { ResponsavelRegisterPayload } from '../../../compartilhado/models/register-payloads';
import { FeedbackService } from '../../../compartilhado/services/feedback.service';

@Component({
  selector: 'app-cadastro-responsavel',
  imports: [ReactiveFormsModule, CadastroLayoutComponent],
  templateUrl: './cadastro-responsavel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class CadastroResponsavelComponent {
  readonly isAba = input<boolean>(false);
  readonly alunoId = input<string | null>(null);

  form: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private cadastroService: CadastroService,
    private feedbackService: FeedbackService,
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      telefone: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(15)]],
      endereco: ['', [Validators.required]],
      sexo: ['', [Validators.required]] });
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  allowOnlyLetters(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    const charStr = String.fromCharCode(charCode);
    if (!/^[a-zA-ZÀ-ÿ\s]*$/.test(charStr)) {
      event.preventDefault();
    }
  }

  onCpfInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    let formatted = value;
    if (value.length > 9) {
      formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      formatted = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      formatted = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    this.form.get('cpf')?.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  onTelefoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    let formatted = value;
    if (value.length === 11) {
      formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 10) {
      formatted = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      formatted = value.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    } else if (value.length > 0) {
      formatted = value.replace(/(\d{1,2})/, '($1');
    }

    this.form.get('telefone')?.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  onSubmit() {
    if (this.form.valid) {
      this.isLoading = true;

      const payload: ResponsavelRegisterPayload = this.form.getRawValue();
      payload.cpf = payload.cpf.replace(/\D/g, '');
      payload.telefone = payload.telefone.replace(/\D/g, '');

      this.cadastroService.submeterCadastro(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.feedbackService.showSuccess('Cadastro realizado com sucesso!');
          this.form.reset();
        },
        error: () => {
          this.isLoading = false;
        } });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
