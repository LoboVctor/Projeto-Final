import { InjectionToken } from '@angular/core';

/**
 * Token de injeção centralizado para a URL base da API REST.
 *
 * Fornecido em `app.config.ts`. Todos os serviços HTTP devem
 * injetar este token em vez de declarar URLs hardcodadas.
 *
 * @example
 * private readonly baseUrl = inject(API_BASE_URL);
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
