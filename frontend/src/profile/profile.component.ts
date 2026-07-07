import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatTabsModule],
  template: `
    <div class="space-y-5">
      <div class="page-header"><h1>My Profile</h1><p>Manage your personal information</p></div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Profile card -->
        <div class="card text-center lg:col-span-1">
          <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-orange-600 font-bold text-3xl">
              {{ user?.firstName?.[0] }}{{ user?.lastName?.[0] }}
            </span>
          </div>
          <h2 class="font-bold text-slate-800 text-lg">{{ user?.firstName }} {{ user?.lastName }}</h2>
          <p class="text-slate-500 text-sm">{{ user?.designation || 'No designation' }}</p>
          <span class="badge badge-blue mt-2 mx-auto">{{ user?.role | titlecase }}</span>
          <div class="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600 text-left">
            <div class="flex items-center gap-2"><mat-icon class="text-slate-400 text-base">badge</mat-icon>{{ user?.employeeId }}</div>
            <div class="flex items-center gap-2"><mat-icon class="text-slate-400 text-base">mail</mat-icon>{{ user?.email }}</div>
            <div *ngIf="user?.phone" class="flex items-center gap-2"><mat-icon class="text-slate-400 text-base">phone</mat-icon>{{ user?.phone }}</div>
            <div *ngIf="user?.department" class="flex items-center gap-2"><mat-icon class="text-slate-400 text-base">business</mat-icon>{{ user?.department?.name }}</div>
            <div *ngIf="user?.joiningDate" class="flex items-center gap-2"><mat-icon class="text-slate-400 text-base">event</mat-icon>Joined {{ user?.joiningDate | date:'MMM y' }}</div>
          </div>
        </div>

        <!-- Edit form -->
        <div class="card lg:col-span-2">
          <mat-tab-group animationDuration="200ms">
            <mat-tab label="Personal Info">
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="py-4 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                    <input formControlName="firstName" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                    <input formControlName="lastName" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input formControlName="phone" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Address</label>
                  <textarea formControlName="address" rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"></textarea>
                </div>
                <button type="submit" [disabled]="saving" class="btn-primary">
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </form>
            </mat-tab>

            <mat-tab label="Change Password">
              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="py-4 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Current Password</label>
                  <input formControlName="currentPassword" type="password" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">New Password</label>
                  <input formControlName="newPassword" type="password" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <button type="submit" [disabled]="changingPwd" class="btn-primary">
                  {{ changingPwd ? 'Changing...' : 'Change Password' }}
                </button>
              </form>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  user: any = null;
  saving = false;
  changingPwd = false;

  profileForm = this.fb.group({ firstName: [''], lastName: [''], phone: [''], address: [''] });
  passwordForm = this.fb.group({ currentPassword: [''], newPassword: [''] });

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) {
      this.user = u;
      this.profileForm.patchValue(u);
    }
  }

  saveProfile(): void {
    this.saving = true;
    this.api.put<any>(`/users/${this.user.id}`, this.profileForm.value).subscribe({
      next: (res) => {
        this.auth.updateCurrentUser(res.data);
        this.user = res.data;
        this.toast.success('Profile updated');
        this.saving = false;
      },
      error: () => { this.toast.error('Failed to save'); this.saving = false; },
    });
  }

  changePassword(): void {
    const { currentPassword, newPassword } = this.passwordForm.value;
    if (!currentPassword || !newPassword) return;
    this.changingPwd = true;
    this.api.put<any>('/auth/change-password', { currentPassword, newPassword }).subscribe({
      next: () => { this.toast.success('Password changed'); this.passwordForm.reset(); this.changingPwd = false; },
      error: (err) => { this.toast.error(err.error?.message || 'Failed'); this.changingPwd = false; },
    });
  }
}
