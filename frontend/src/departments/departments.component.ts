import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { DepartmentFormComponent } from './department-form/department-form.component';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between page-header">
        <div><h1>Departments</h1><p>{{ departments.length }} departments</p></div>
        <button (click)="openForm()" class="btn-primary flex items-center gap-2">
          <mat-icon class="text-lg">add</mat-icon> Add Department
        </button>
      </div>

      <div *ngIf="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div *ngFor="let i of [1,2,3,4]" class="card animate-pulse h-40 bg-slate-100 rounded-xl"></div>
      </div>

      <div *ngIf="!loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div *ngFor="let dept of departments" class="card hover:shadow-card-hover transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <mat-icon class="text-orange-500">business</mat-icon>
            </div>
            <div class="flex gap-1">
              <button (click)="openForm(dept)" class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <mat-icon class="text-slate-400 text-lg">edit</mat-icon>
              </button>
              <button (click)="delete(dept)" class="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                <mat-icon class="text-slate-400 hover:text-red-500 text-lg">delete</mat-icon>
              </button>
            </div>
          </div>
          <h3 class="font-semibold text-slate-800">{{ dept.name }}</h3>
          <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ dept.description || 'No description' }}</p>
          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs text-slate-600">
              <mat-icon class="text-sm text-slate-400">people</mat-icon>
              {{ dept.members?.length || 0 }} members
            </div>
            <div *ngIf="dept.manager" class="flex items-center gap-1.5 text-xs text-slate-600">
              <div class="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                <span class="text-orange-600 text-xs font-bold">{{ dept.manager.firstName?.[0] }}</span>
              </div>
              {{ dept.manager.firstName }} {{ dept.manager.lastName }}
            </div>
          </div>
        </div>

        <div *ngIf="departments.length === 0" class="col-span-3 text-center py-16 text-slate-400">
          <mat-icon class="text-4xl">business</mat-icon>
          <p class="mt-2">No departments yet</p>
        </div>
      </div>
    </div>
  `,
})
export class DepartmentsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  departments: any[] = [];
  loading = true;

  ngOnInit(): void { this.loadDepartments(); }

  loadDepartments(): void {
    this.loading = true;
    this.api.get<any>('/departments').subscribe({
      next: (res) => { this.departments = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openForm(dept?: any): void {
    const ref = this.dialog.open(DepartmentFormComponent, { width: '480px', data: dept });
    ref.afterClosed().subscribe(r => { if (r) this.loadDepartments(); });
  }

  delete(dept: any): void {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    this.api.delete<any>(`/departments/${dept.id}`).subscribe({
      next: () => { this.toast.success('Department deleted'); this.loadDepartments(); },
      error: (err) => this.toast.error(err.error?.message || 'Cannot delete'),
    });
  }
}
