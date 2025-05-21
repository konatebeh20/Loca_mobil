import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./main/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'map',
    loadComponent: () => import('./main/map/map.page').then(m => m.MapPage)
  },
  {
    path: 'reports',
    loadComponent: () => import('./main/reports/reports.page').then(m => m.ReportsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./dashboard/settings/settings.page').then( m => m.SettingsPage)
  },
  // {
  //   path: 'dashboard',
  //   loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.routes)
  // },

  
  // Route de fallback pour les pages non trouvées
  {
    path: '**',
    redirectTo: 'home'
  }


  // {
  //   path: '',
  //   redirectTo: 'folder/inbox',
  //   pathMatch: 'full',
  // },
  // {
  //   path: 'folder/:id',
  //   loadComponent: () =>
  //     import('./folder/folder.page').then((m) => m.FolderPage),
  // },

  
  // {
  //   path: 'login',
  //   loadComponent: () => import('./auth/login/login.page').then( m => m.LoginPage)
  // },
  // {
  //   path: 'register',
  //   loadComponent: () => import('./auth/register/register.page').then( m => m.RegisterPage)
  // },
  // {
  //   path: 'forgot-password',
  //   loadComponent: () => import('./auth/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  // },
  // {
  //   path: 'home',
  //   loadComponent: () => import('./main/home/home.page').then( m => m.HomePage)
  // },
  // {
  //   path: 'map',
  //   loadComponent: () => import('./main/map/map.page').then( m => m.MapPage)
  // },
  // {
  //   path: 'reports',
  //   loadComponent: () => import('./main/reports/reports.page').then( m => m.ReportsPage)
  // },
  // {
  //   path: 'settings',
  //   loadComponent: () => import('./dashboard/settings/settings.page').then( m => m.SettingsPage)
  // },
];
