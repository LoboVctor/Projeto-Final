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

  /**
   * Rejeita valores considerados inválidos para campos de texto livre:
   * - apenas espaços em branco
   * - apenas dígitos numéricos
   * - apenas hífens
   * Padrão extraído dos modais da aba "Saúde".
   */
  static textoInvalido(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const normalizado = String(value).trim();
      if (!normalizado) return { soEspacos: true };
      if (/^\d+$/.test(normalizado)) return { soNumeros: true };
      if (/^-+$/.test(normalizado)) return { soHifens: true };

      return null;
    };
  }
}
