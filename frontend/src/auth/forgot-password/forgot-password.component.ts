import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="text-center mb-8">
            <div class="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-white text-3xl">lock_reset</mat-icon>
            </div>
            <h1 class="text-2xl font-bold text-slate-800">Reset password</h1>
            <p class="text-slate-500 text-sm mt-1">We'll send a reset link to your email</p>
          </div>

          <div *ngIf="!submitted">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input formControlName="email" type="email" placeholder="you@company.com"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
              </div>
              <button type="submit" [disabled]="loading"
                class="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                {{ loading ? 'Sending...' : 'Send reset link' }}
              </button>
            </form>
          </div>

          <div *ngIf="submitted" class="text-center py-4">
            <mat-icon class="text-5xl text-emerald-500">check_circle</mat-icon>
            <p class="text-slate-700 font-medium mt-3">Check your inbox</p>
            <p class="text-slate-500 text-sm mt-1">If an account exists, we sent a reset link.</p>
          </div>

          <a routerLink="/login" class="flex items-center justify-center gap-1 mt-6 text-sm text-slate-500 hover:text-orange-500 transition-colors">
            <mat-icon class="text-base">arrow_back</mat-icon> Back to login
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  loading = false;
  submitted = false;

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.api.post('/auth/forgot-password', this.form.value).subscribe({
      next: () => { this.submitted = true; this.loading = false; },
      error: () => { this.submitted = true; this.loading = false; },
    });
  }
}
