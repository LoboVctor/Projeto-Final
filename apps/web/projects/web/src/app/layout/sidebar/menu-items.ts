export interface MenuItem {
  label: string;
  route: string;
  /**
   * Name of the Lucide icon (used as component selector, e.g. 'home' => <lucide-home>)
   */
  icon: string;
}

export const DEFAULT_MENU: MenuItem[] = [
  { label: 'Home', route: '/home', icon: 'home' },
  { label: 'Turmas', route: '/turmas', icon: 'users' },
  { label: 'Alunos', route: '/alunos', icon: 'graduation-cap' },
  { label: 'Calendário', route: '/calendario', icon: 'calendar' },
];

export const COORDINATOR_MENU: MenuItem[] = [
  { label: 'Home', route: '/coordenador/home', icon: 'home' },
  { label: 'Turmas', route: '/coordenador/turmas', icon: 'users' },
  { label: 'Alunos', route: '/coordenador/alunos', icon: 'graduation-cap' },
  { label: 'Professores', route: '/coordenador/professores', icon: 'users' },
  { label: 'Calendário', route: '/coordenador/calendario', icon: 'calendar' },
];

export const LOGOUT_ITEM: MenuItem = { label: 'Sair', route: '/logout', icon: 'log-out' };
