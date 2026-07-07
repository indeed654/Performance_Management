import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models/user.model';
import { EmployeeFormComponent } from './employee-form/employee-form.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatDialogModule, MatMenuModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3 page-header">
        <div>
          <h1>Employees</h1>
          <p>{{ pagination().total }} total employees</p>
        </div>
        <button *ngIf="isAdmin" (click)="openForm()" class="btn-primary flex items-center gap-2">
          <mat-icon class="text-lg">add</mat-icon> Add Employee
        </button>
      </div>

      <!-- Filters -->
      <div class="card py-4 flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-48 relative">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</mat-icon>
          <input [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Search employees..."
            class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <select [(ngModel)]="filters.role" (ngModelChange)="loadEmployees()"
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <select [(ngModel)]="filters.isActive" (ngModelChange)="loadEmployees()"
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden p-0">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of employees">
                <td>
                  <a [routerLink]="['/employees', emp.id]" class="flex items-center gap-3 hover:text-orange-500 transition-colors">
                    <div class="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-orange-600 font-semibold text-xs">
                        {{ emp.firstName?.[0] }}{{ emp.lastName?.[0] }}
                      </span>
                    </div>
                    <div>
                      <p class="font-medium text-slate-700">{{ emp.firstName }} {{ emp.lastName }}</p>
                      <p class="text-xs text-slate-400">{{ emp.email }}</p>
                    </div>
                  </a>
                </td>
                <td class="font-mono text-xs text-slate-500">{{ emp.employeeId }}</td>
                <td class="text-slate-600">{{ emp.department?.name || '—' }}</td>
                <td>
                  <span [class]="'badge ' + roleBadge(emp.role)">{{ emp.role }}</span>
                </td>
                <td>
                  <span [class]="'badge ' + (emp.isActive ? 'badge-green' : 'badge-red')">
                    {{ emp.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-slate-500 text-xs">{{ emp.joiningDate | date:'MMM y' }}</td>
                <td class="text-right">
                  <button [matMenuTriggerFor]="menu" class="p-1.5 hover:bg-slate-100 rounded-lg">
                    <mat-icon class="text-slate-400 text-xl">more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <a mat-menu-item [routerLink]="['/employees', emp.id]">
                      <mat-icon>visibility</mat-icon> View
                    </a>
                    <button mat-menu-item *ngIf="isAdmin" (click)="openForm(emp)">
                      <mat-icon>edit</mat-icon> Edit
                    </button>
                    <button mat-menu-item *ngIf="isAdmin" (click)="toggleStatus(emp)">
                      <mat-icon>{{ emp.isActive ? 'person_off' : 'person' }}</mat-icon>
                      {{ emp.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                  </mat-menu>
                </td>
              </tr>
              <tr *ngIf="!loading && employees.length === 0">
                <td colspan="7" class="text-center py-12 text-slate-400">
                  <mat-icon class="text-4xl mb-2">people</mat-icon>
                  <p>No employees found</p>
                </td>
              </tr>
              <tr *ngIf="loading">
                <td colspan="7" class="text-center py-8 text-slate-400">Loading...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p class="text-xs text-slate-500">
            Showing {{ (pagination().page - 1) * pagination().limit + 1 }}–{{ Math.min(pagination().page * pagination().limit, pagination().total) }}
            of {{ pagination().total }}
          </p>
          <div class="flex gap-1">
            <button (click)="goToPage(pagination().page - 1)" [disabled]="pagination().page <= 1"
              class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            <button (click)="goToPage(pagination().page + 1)" [disabled]="pagination().page >= pagination().totalPages"
              class="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EmployeesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  get isAdmin() { return this.auth.userRole() === 'admin'; }

  employees: User[] = [];
  loading = true;
  searchTerm = '';
  searchTimer: any;
  filters = { role: '', isActive: '' };
  pagination = signal({ total: 0, page: 1, limit: 15, totalPages: 1 });
  Math = Math;

  ngOnInit(): void { this.loadEmployees(); }

  loadEmployees(): void {
    this.loading = true;
    this.api.get<any>('/users', {
      page: this.pagination().page,
      limit: this.pagination().limit,
      search: this.searchTerm,
      ...this.filters,
    }).subscribe({
      next: (res) => {
        this.employees = res.data;
        this.pagination.set(res.pagination);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadEmployees(), 400);
  }

  goToPage(p: number): void {
    this.pagination.update(prev => ({ ...prev, page: p }));
    this.loadEmployees();
  }

  openForm(emp?: User): void {
    const ref = this.dialog.open(EmployeeFormComponent, {
      width: '560px',
      data: emp,
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadEmployees();
    });
  }

  toggleStatus(emp: User): void {
    this.api.put<any>(`/users/${emp.id}`, { isActive: !emp.isActive }).subscribe({
      next: () => {
        emp.isActive = !emp.isActive;
        this.toast.success(`Employee ${emp.isActive ? 'activated' : 'deactivated'}`);
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed'),
    });
  }

  roleBadge(role: string): string {
    const map: Record<string, string> = { admin: 'badge-red', manager: 'badge-blue', employee: 'badge-gray' };
    return map[role] || 'badge-gray';
  }
}
