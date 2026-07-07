import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('../auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('../auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },

  // Protected layout
  {
    path: '',
    loadComponent: () => import('../shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'employees',
        loadComponent: () => import('../employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [roleGuard(['admin', 'manager'])],
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('../employees/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
      },
      {
        path: 'departments',
        loadComponent: () => import('../departments/departments.component').then(m => m.DepartmentsComponent),
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'attendance',
        loadComponent: () => import('../attendance/attendance.component').then(m => m.AttendanceComponent),
      },
      {
        path: 'leaves',
        loadComponent: () => import('../leaves/leaves.component').then(m => m.LeavesComponent),
      },
      {
        path: 'kra',
        loadComponent: () => import('../kra/kra.component').then(m => m.KraComponent),
      },
      {
        path: 'goals',
        loadComponent: () => import('../goals/goals.component').then(m => m.GoalsComponent),
      },
      {
        path: 'performance',
        loadComponent: () => import('../performance/performance.component').then(m => m.PerformanceComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('../notifications/notifications.component').then(m => m.NotificationsComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('../settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard(['admin'])],
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
