import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static notOnlyNumbers(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values, let Validators.required handle it
      }
      // Check if it contains at least one letter (allowing letters with accents as well)
      const hasLetter = /[a-zA-ZÀ-ÿ]/.test(control.value);
      return hasLetter ? null : { onlyNumbers: true };
    };
  }

  static numericOnly(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      // Check if it contains only numbers
      const isNumeric = /^\d+$/.test(control.value);
      return isNumeric ? null : { numericOnly: true };
    };
  }
}
