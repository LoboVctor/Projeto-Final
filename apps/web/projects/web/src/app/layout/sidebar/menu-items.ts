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
  { label: 'Gerenciamento de Alunos', route: '/alunos', icon: 'graduation-cap' },
  { label: 'Calendário', route: '/calendario', icon: 'calendar' },
];

export const LOGOUT_ITEM: MenuItem = { label: 'Sair', route: '/logout', icon: 'log-out' };
