import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-slate-800">{{ data?.id ? 'Edit Employee' : 'Add Employee' }}</h2>
        <button (click)="close()" class="p-1 hover:bg-slate-100 rounded-lg">
          <mat-icon class="text-slate-400">close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">First Name *</label>
            <input formControlName="firstName" class="input" placeholder="John" />
          </div>
          <div>
            <label class="label">Last Name *</label>
            <input formControlName="lastName" class="input" placeholder="Doe" />
          </div>
        </div>

        <div>
          <label class="label">Email *</label>
          <input formControlName="email" type="email" class="input" placeholder="john@company.com" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Role</label>
            <select formControlName="role" class="input">
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label class="label">Phone</label>
            <input formControlName="phone" class="input" placeholder="+1-555-0000" />
          </div>
        </div>

        <div>
          <label class="label">Designation</label>
          <input formControlName="designation" class="input" placeholder="Software Engineer" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Joining Date</label>
            <input formControlName="joiningDate" type="date" class="input" />
          </div>
          <div *ngIf="!data?.id">
            <label class="label">Password</label>
            <input formControlName="password" type="password" class="input" placeholder="Defaults to password123" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="close()" class="btn-secondary">Cancel</button>
          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Saving...' : data?.id ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .label { @apply block text-xs font-medium text-slate-600 mb-1; }
    .input { @apply w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300; }
  `],
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  dialogRef = inject(MatDialogRef<EmployeeFormComponent>);
  data = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['employee'],
    phone: [''],
    designation: [''],
    joiningDate: [''],
    password: [''],
  });

  loading = false;

  ngOnInit(): void {
    if (this.data?.id) {
      this.form.patchValue(this.data);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const request = this.data?.id
      ? this.api.put(`/users/${this.data.id}`, this.form.value)
      : this.api.post('/users', this.form.value);

    request.subscribe({
      next: () => {
        this.toast.success(this.data?.id ? 'Employee updated' : 'Employee created');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to save');
        this.loading = false;
      },
    });
  }

  close(): void { this.dialogRef.close(); }
}
