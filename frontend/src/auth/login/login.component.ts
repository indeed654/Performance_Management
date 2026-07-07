import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">

      <div class="w-full max-w-md">
        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <!-- Logo -->
          <div class="text-center mb-8">
            <div class="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span class="text-white font-bold text-2xl">P</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-800">Welcome back</h1>
            <p class="text-slate-500 text-sm mt-1">Sign in to your PMS account</p>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</mat-icon>
                <input
                  formControlName="email"
                  type="email"
                  placeholder="you@company.com"
                  class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  [class.border-red-400]="submitted && form.get('email')?.invalid" />
              </div>
              <p *ngIf="submitted && form.get('email')?.invalid" class="text-red-500 text-xs mt-1">
                Valid email required
              </p>
            </div>

            <!-- Password -->
            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label class="block text-sm font-medium text-slate-700">Password</label>
                <a routerLink="/forgot-password" class="text-xs text-orange-500 hover:text-orange-600 font-medium">
                  Forgot password?
                </a>
              </div>
              <div class="relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</mat-icon>
                <input
                  formControlName="password"
                  [type]="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  [class.border-red-400]="submitted && form.get('password')?.invalid" />
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <mat-icon class="text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              <p *ngIf="submitted && form.get('password')?.invalid" class="text-red-500 text-xs mt-1">
                Password required
              </p>
            </div>

            <!-- Remember me -->
            <div class="flex items-center gap-2">
              <input type="checkbox" formControlName="rememberMe" id="remember"
                class="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-400" />
              <label for="remember" class="text-sm text-slate-600">Remember me</label>
            </div>

            <!-- Submit -->
            <button type="submit"
              [disabled]="loading"
              class="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
              <svg *ngIf="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
              </svg>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>

          <!-- Demo credentials -->
          <div class="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p class="text-xs font-semibold text-slate-500 mb-2">Demo credentials</p>
            <div class="space-y-1 text-xs text-slate-600">
              <button (click)="fillCredentials('admin@company.com', 'password123')"
                class="block w-full text-left hover:text-orange-500 transition-colors py-0.5">
                👑 Admin: admin&#64;company.com / password123
              </button>
              <button (click)="fillCredentials('manager@company.com', 'password123')"
                class="block w-full text-left hover:text-orange-500 transition-colors py-0.5">
                👔 Manager: manager&#64;company.com / password123
              </button>
              <button (click)="fillCredentials('alice.smith@company.com', 'password123')"
                class="block w-full text-left hover:text-orange-500 transition-colors py-0.5">
                👤 Employee: alice.smith&#64;company.com / password123
              </button>
            </div>
          </div>
        </div>

        <p class="text-center text-slate-400 text-xs mt-6">
          Performance Management System &copy; 2024
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  showPassword = false;
  loading = false;
  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;
    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.toast.success('Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Login failed. Please check your credentials.');
        this.loading = false;
      },
    });
  }

  fillCredentials(email: string, password: string): void {
    this.form.patchValue({ email, password });
  }
}
