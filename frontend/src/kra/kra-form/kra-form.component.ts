import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-kra-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-slate-800">{{ data?.id ? 'Update KRA' : 'Assign KRA' }}</h2>
        <button (click)="close()"><mat-icon class="text-slate-400">close</mat-icon></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div *ngIf="!isEmployee">
          <label class="block text-xs font-medium text-slate-600 mb-1">Employee *</label>
          <select formControlName="userId" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
            <option value="">Select employee</option>
            <option *ngFor="let emp of employees" [value]="emp.id">{{ emp.firstName }} {{ emp.lastName }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Title *</label>
          <input formControlName="title" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="KRA title" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Target *</label>
          <input formControlName="target" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Target to achieve" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Weightage % *</label>
            <input formControlName="weightage" type="number" min="1" max="100" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Quarter *</label>
            <select formControlName="quarter" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              <option *ngFor="let q of ['Q1','Q2','Q3','Q4']" [value]="q">{{ q }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Year *</label>
            <input formControlName="year" type="number" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>
        <div *ngIf="data?.id">
          <label class="block text-xs font-medium text-slate-600 mb-1">Achievement</label>
          <input formControlName="achievement" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="What was achieved?" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="close()" class="btn-secondary">Cancel</button>
          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Saving...' : data?.id ? 'Update' : 'Assign' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class KraFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  dialogRef = inject(MatDialogRef<KraFormComponent>);
  data = inject(MAT_DIALOG_DATA);

  get isEmployee() { return this.auth.userRole() === 'employee'; }

  employees: any[] = [];
  loading = false;

  form = this.fb.group({
    userId: [''],
    title: ['', Validators.required],
    target: ['', Validators.required],
    weightage: [25, [Validators.required, Validators.min(1), Validators.max(100)]],
    quarter: ['Q1'],
    year: [new Date().getFullYear()],
    achievement: [''],
  });

  ngOnInit(): void {
    if (this.data) this.form.patchValue(this.data);
    if (!this.isEmployee) {
      this.api.get<any>('/users', { limit: 100 }).subscribe(res => { this.employees = res.data; });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const req = this.data?.id
      ? this.api.put(`/kras/${this.data.id}`, this.form.value)
      : this.api.post('/kras', this.form.value);
    req.subscribe({
      next: () => { this.toast.success('KRA saved'); this.dialogRef.close(true); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed'); this.loading = false; },
    });
  }
  close() { this.dialogRef.close(); }
}
