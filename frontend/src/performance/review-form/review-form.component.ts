import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
        <button (click)="close()"><mat-icon class="text-slate-400">close</mat-icon></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Create mode -->
        <ng-container *ngIf="data.mode === 'create'">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Employee *</label>
            <select formControlName="userId" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              <option value="">Select employee</option>
              <option *ngFor="let emp of employees" [value]="emp.id">{{ emp.firstName }} {{ emp.lastName }}</option>
            </select>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Review Type</label>
              <select formControlName="reviewType" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Quarter</label>
              <select formControlName="quarter" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="">N/A</option>
                <option *ngFor="let q of ['Q1','Q2','Q3','Q4']" [value]="q">{{ q }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Year</label>
              <input formControlName="year" type="number" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>
        </ng-container>

        <!-- Self assessment mode -->
        <ng-container *ngIf="data.mode === 'self'">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Self Rating (0–5) *</label>
            <input formControlName="selfRating" type="number" min="0" max="5" step="0.5"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Self Assessment *</label>
            <textarea formControlName="selfAssessment" rows="4" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" placeholder="Describe your performance this period..."></textarea>
          </div>
        </ng-container>

        <!-- Manager review mode -->
        <ng-container *ngIf="data.mode === 'manager'">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Manager Rating (0–5) *</label>
            <input formControlName="managerRating" type="number" min="0" max="5" step="0.5"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Manager Feedback</label>
            <textarea formControlName="managerFeedback" rows="3" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Strengths</label>
              <textarea formControlName="strengths" rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Areas to Improve</label>
              <textarea formControlName="improvements" rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"></textarea>
            </div>
          </div>
        </ng-container>

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
export class ReviewFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  dialogRef = inject(MatDialogRef<ReviewFormComponent>);
  data = inject(MAT_DIALOG_DATA);

  employees: any[] = [];
  loading = false;

  get title() {
    if (this.data.mode === 'create') return 'Create Review';
    if (this.data.mode === 'self') return 'Self Assessment';
    return 'Manager Review';
  }

  form = this.fb.group({
    userId: [''],
    reviewType: ['quarterly'],
    quarter: ['Q1'],
    year: [new Date().getFullYear()],
    selfRating: [null],
    selfAssessment: [''],
    managerRating: [null],
    managerFeedback: [''],
    strengths: [''],
    improvements: [''],
  });

  ngOnInit(): void {
    if (this.data.mode === 'create') {
      this.api.get<any>('/users', { limit: 100, role: 'employee' }).subscribe(res => {
        this.employees = res.data;
      });
    }
  }

  onSubmit(): void {
    this.loading = true;
    let req;
    if (this.data.mode === 'create') {
      req = this.api.post('/performance', this.form.value);
    } else if (this.data.mode === 'self') {
      req = this.api.put(`/performance/${this.data.review.id}/self-assessment`, this.form.value);
    } else {
      req = this.api.put(`/performance/${this.data.review.id}/complete`, this.form.value);
    }
    req.subscribe({
      next: () => { this.toast.success('Saved'); this.dialogRef.close(true); },
      error: (err: any) => { this.toast.error(err.error?.message || 'Failed'); this.loading = false; },
    });
  }

  close() { this.dialogRef.close(); }
}
