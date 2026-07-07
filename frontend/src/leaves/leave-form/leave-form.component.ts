import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-slate-800">Apply for Leave</h2>
        <button (click)="close()"><mat-icon class="text-slate-400">close</mat-icon></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Leave Type *</label>
          <select formControlName="type" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
            <option value="">Select type</option>
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Start Date *</label>
            <input formControlName="startDate" type="date" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">End Date *</label>
            <input formControlName="endDate" type="date" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
          <textarea formControlName="reason" rows="3" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" placeholder="Reason for leave..."></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="close()" class="btn-secondary">Cancel</button>
          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Applying...' : 'Apply' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class LeaveFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  dialogRef = inject(MatDialogRef<LeaveFormComponent>);

  form = this.fb.group({
    type: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['', Validators.required],
  });
  loading = false;

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.api.post('/leaves/apply', this.form.value).subscribe({
      next: () => { this.toast.success('Leave application submitted'); this.dialogRef.close(true); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed'); this.loading = false; },
    });
  }
  close() { this.dialogRef.close(); }
}
