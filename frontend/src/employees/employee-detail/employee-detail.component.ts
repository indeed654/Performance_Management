import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/services/api.service';
import { User } from '../../core/models/user.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTabsModule],
  template: `
    <div *ngIf="loading" class="animate-pulse space-y-4">
      <div class="h-32 bg-slate-100 rounded-xl"></div>
      <div class="h-64 bg-slate-100 rounded-xl"></div>
    </div>

    <div *ngIf="!loading && employee" class="space-y-5">
      <!-- Back -->
      <a routerLink="/employees" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-orange-500 transition-colors">
        <mat-icon class="text-base">arrow_back</mat-icon> Back to Employees
      </a>

      <!-- Profile header -->
      <div class="card flex flex-wrap items-center gap-5">
        <div class="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <img *ngIf="employee.avatar" [src]="apiBase + '/' + employee.avatar" class="w-20 h-20 rounded-2xl object-cover" />
          <span *ngIf="!employee.avatar" class="text-orange-600 font-bold text-3xl">
            {{ employee.firstName?.[0] }}{{ employee.lastName?.[0] }}
          </span>
        </div>
        <div class="flex-1">
          <div class="flex flex-wrap items-start gap-2">
            <div>
              <h2 class="text-xl font-bold text-slate-800">{{ employee.firstName }} {{ employee.lastName }}</h2>
              <p class="text-slate-500 text-sm">{{ employee.designation || 'No designation' }}</p>
            </div>
            <span [class]="'badge ml-auto ' + (employee.isActive ? 'badge-green' : 'badge-red')">
              {{ employee.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-slate-600">
            <span class="flex items-center gap-1"><mat-icon class="text-base text-slate-400">badge</mat-icon>{{ employee.employeeId }}</span>
            <span class="flex items-center gap-1"><mat-icon class="text-base text-slate-400">mail</mat-icon>{{ employee.email }}</span>
            <span *ngIf="employee.phone" class="flex items-center gap-1"><mat-icon class="text-base text-slate-400">phone</mat-icon>{{ employee.phone }}</span>
            <span class="flex items-center gap-1"><mat-icon class="text-base text-slate-400">business</mat-icon>{{ employee.department?.name || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="card p-0 overflow-hidden">
        <mat-tab-group animationDuration="200ms" class="px-4">
          <mat-tab label="Overview">
            <div class="py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Personal Details</p>
                <dl class="space-y-2 text-sm">
                  <div class="flex gap-2"><dt class="text-slate-500 w-28">Date of Birth</dt><dd class="text-slate-700">{{ (employee.dateOfBirth | date:'MMM d, y') || '—' }}</dd></div>
                  <div class="flex gap-2"><dt class="text-slate-500 w-28">Joining Date</dt><dd class="text-slate-700">{{ (employee.joiningDate | date:'MMM d, y') || '—' }}</dd></div>
                  <div class="flex gap-2"><dt class="text-slate-500 w-28">Role</dt><dd class="text-slate-700 capitalize">{{ employee.role }}</dd></div>
                  <div class="flex gap-2"><dt class="text-slate-500 w-28">Manager</dt><dd class="text-slate-700">{{ employee.manager ? employee.manager.firstName + ' ' + employee.manager.lastName : '—' }}</dd></div>
                </dl>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Skills</p>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let skill of employee.skills" class="badge badge-blue">{{ skill }}</span>
                  <span *ngIf="!employee.skills?.length" class="text-slate-400 text-sm">No skills added</span>
                </div>
              </div>
            </div>
          </mat-tab>
          <mat-tab label="KRAs">
            <div class="py-5">
              <p class="text-sm text-slate-500">KRAs for this employee are shown in the KRA module.</p>
              <a [routerLink]="['/kra']" class="text-orange-500 text-sm font-medium">View KRAs →</a>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>

    <div *ngIf="!loading && !employee" class="text-center py-20 text-slate-400">
      <mat-icon class="text-5xl">person_off</mat-icon>
      <p class="mt-2">Employee not found</p>
    </div>
  `,
})
export class EmployeeDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  employee: User | null = null;
  loading = true;
  apiBase = environment.apiUrl.replace('/api', '');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<any>(`/users/${id}`).subscribe({
      next: (res) => { this.employee = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
