import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { errorInterceptor } from './nucleo/interceptors/error.interceptor';
import { authInterceptor } from './nucleo/interceptors/auth-interceptor';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { API_BASE_URL } from './nucleo/config/api.config';

export const appConfig: ApplicationConfig = {
  providers: [
    // ── URL base da API — altere aqui para mudar em todos os serviços ──
    { provide: API_BASE_URL, useValue: 'http://localhost:3000/api/v1' },
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),
  ] };
