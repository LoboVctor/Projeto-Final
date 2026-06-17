import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /** Rejeita valores compostos apenas por dígitos numéricos. */
  static notOnlyNumbers(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        // Valores vazios são tratados pelo Validators.required
        return null;
      }
      // Verifica se contém ao menos uma letra (incluindo letras acentuadas)
      const possuiLetra = /[a-zA-ZÀ-ÿ]/.test(control.value);
      return possuiLetra ? null : { onlyNumbers: true };
    };
  }

  /** Aceita apenas valores compostos exclusivamente por dígitos numéricos. */
  static numericOnly(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      // Verifica se contém somente dígitos
      const eNumerico = /^\d+$/.test(control.value);
      return eNumerico ? null : { numericOnly: true };
    };
  }
}
