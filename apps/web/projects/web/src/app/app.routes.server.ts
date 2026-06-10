import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ── Rota pública: pode ser pré-renderizada com segurança ──────────────
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  // ── CR-16: Rotas dinâmicas (dependem de auth/dados) usam Client-side ─
  // RenderMode.Prerender em rotas autenticadas quebraria em produção pois
  // elas dependem do token JWT e de dados carregados dinamicamente.
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
