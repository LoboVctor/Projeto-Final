import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FeedbackService } from '../../shared/services/feedback.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const feedbackService = inject(FeedbackService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado.';

      if (error.error instanceof ErrorEvent) {
        errorMessage = 'Erro interno do cliente.';
      } else {
        switch (error.status) {
          case 0:
            errorMessage = 'Não foi possível conectar ao servidor.';
            break;
          case 401:
            errorMessage = 'Sessão inválida. Faça login novamente.';
            break;
          case 403:
            errorMessage = 'Você não possui permissão para realizar esta ação.';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado.';
            break;
          case 409:
            errorMessage = 'Já existe um registro com essas informações.';
            break;
          case 422:
            errorMessage = 'Os dados informados são inválidos.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
            break;
          default:
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            }
            break;
        }
      }

      feedbackService.showError(errorMessage);

      return throwError(() => error);
    })
  );
};