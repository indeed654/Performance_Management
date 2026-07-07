import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-slate-800">{{ data?.id ? 'Edit Goal' : 'New Goal' }}</h2>
        <button (click)="close()"><mat-icon class="text-slate-400">close</mat-icon></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Title *</label>
          <input formControlName="title" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Goal title" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea formControlName="description" rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"></textarea>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select formControlName="category" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              <option value="performance">Performance</option>
              <option value="learning">Learning</option>
              <option value="personal">Personal</option>
              <option value="team">Team</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Priority</label>
            <select formControlName="priority" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
            <input formControlName="dueDate" type="date" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="close()" class="btn-secondary">Cancel</button>
          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class GoalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  dialogRef = inject(MatDialogRef<GoalFormComponent>);
  data = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: ['performance'],
    priority: ['medium'],
    dueDate: [''],
  });
  loading = false;

  ngOnInit(): void { if (this.data) this.form.patchValue(this.data); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const req = this.data?.id
      ? this.api.put(`/goals/${this.data.id}`, this.form.value)
      : this.api.post('/goals', this.form.value);
    req.subscribe({
      next: () => { this.toast.success('Goal saved'); this.dialogRef.close(true); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed'); this.loading = false; },
    });
  }
  close() { this.dialogRef.close(); }
}
