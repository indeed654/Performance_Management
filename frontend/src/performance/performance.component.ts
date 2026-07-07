import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { ReviewFormComponent } from './review-form/review-form.component';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatProgressBarModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between page-header">
        <div><h1>Performance Reviews</h1><p>Track and manage performance evaluations</p></div>
        <button *ngIf="!isEmployee" (click)="openCreateReview()" class="btn-primary flex items-center gap-2">
          <mat-icon class="text-lg">add</mat-icon> New Review
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div *ngFor="let review of reviews" class="card hover:shadow-card-hover transition-shadow">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <!-- Employee info -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-orange-600 font-bold text-sm">
                  {{ review.employee?.firstName?.[0] }}{{ review.employee?.lastName?.[0] }}
                </span>
              </div>
              <div>
                <p class="font-semibold text-slate-800">{{ review.employee?.firstName }} {{ review.employee?.lastName }}</p>
                <p class="text-xs text-slate-400">{{ review.employee?.designation }}</p>
              </div>
            </div>

            <!-- Review meta -->
            <div class="flex flex-wrap gap-2 items-center">
              <span class="badge badge-blue">{{ review.reviewType | titlecase }}</span>
              <span class="badge badge-gray">{{ review.quarter || '' }} {{ review.year }}</span>
              <span [class]="'badge ' + statusBadge(review.status)">{{ review.status }}</span>
            </div>
          </div>

          <!-- Scores -->
          <div class="mt-4 grid grid-cols-3 gap-4">
            <div class="text-center p-3 bg-slate-50 rounded-lg">
              <p class="text-xl font-bold text-slate-700">{{ review.selfRating || '—' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Self Rating</p>
            </div>
            <div class="text-center p-3 bg-slate-50 rounded-lg">
              <p class="text-xl font-bold text-slate-700">{{ review.managerRating || '—' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Manager Rating</p>
            </div>
            <div class="text-center p-3 bg-orange-50 rounded-lg">
              <p class="text-xl font-bold text-orange-600">{{ review.finalScore || '—' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Final Score</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
            <button *ngIf="isEmployee && review.status === 'draft'" (click)="openSelfAssessment(review)"
              class="btn-primary text-xs">
              Submit Self Assessment
            </button>
            <button *ngIf="!isEmployee && review.status === 'submitted'" (click)="openManagerReview(review)"
              class="btn-primary text-xs">
              Complete Review
            </button>
            <div *ngIf="review.managerFeedback" class="w-full">
              <p class="text-xs font-medium text-slate-500 mb-1">Manager Feedback</p>
              <p class="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">{{ review.managerFeedback }}</p>
            </div>
          </div>
        </div>

        <div *ngIf="reviews.length === 0" class="text-center py-16 text-slate-400">
          <mat-icon class="text-4xl">insights</mat-icon>
          <p class="mt-2">No performance reviews yet</p>
        </div>
      </div>
    </div>
  `,
})
export class PerformanceComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  get isEmployee() { return this.auth.userRole() === 'employee'; }

  reviews: any[] = [];

  ngOnInit(): void { this.loadReviews(); }

  loadReviews(): void {
    this.api.get<any>('/performance').subscribe(res => { this.reviews = res.data; });
  }

  openCreateReview(): void {
    const ref = this.dialog.open(ReviewFormComponent, { width: '520px', data: { mode: 'create' } });
    ref.afterClosed().subscribe(r => { if (r) this.loadReviews(); });
  }

  openSelfAssessment(review: any): void {
    const ref = this.dialog.open(ReviewFormComponent, { width: '520px', data: { mode: 'self', review } });
    ref.afterClosed().subscribe(r => { if (r) this.loadReviews(); });
  }

  openManagerReview(review: any): void {
    const ref = this.dialog.open(ReviewFormComponent, { width: '520px', data: { mode: 'manager', review } });
    ref.afterClosed().subscribe(r => { if (r) this.loadReviews(); });
  }

  statusBadge(s: string): string {
    const m: any = { completed: 'badge-green', submitted: 'badge-blue', reviewed: 'badge-yellow', draft: 'badge-gray' };
    return m[s] || 'badge-gray';
  }
}
