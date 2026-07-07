import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { GoalFormComponent } from './goal-form/goal-form.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressBarModule, MatDialogModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between page-header">
        <div><h1>Goals</h1><p>Set and track your professional goals</p></div>
        <button (click)="openForm()" class="btn-primary flex items-center gap-2">
          <mat-icon class="text-lg">add</mat-icon> Add Goal
        </button>
      </div>

      <div class="flex gap-2 flex-wrap">
        <button *ngFor="let s of statusFilters" (click)="filterStatus = s; loadGoals()"
          [class.bg-orange-500]="filterStatus === s" [class.text-white]="filterStatus === s"
          [class.bg-white]="filterStatus !== s" [class.text-slate-600]="filterStatus !== s"
          class="px-4 py-1.5 rounded-full text-xs font-medium border border-slate-200 transition-colors capitalize">
          {{ s }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div *ngFor="let goal of goals" class="card hover:shadow-card-hover transition-shadow">
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex-1">
              <div class="flex flex-wrap gap-1.5 mb-2">
                <span [class]="'badge ' + priorityBadge(goal.priority)">{{ goal.priority }}</span>
                <span [class]="'badge ' + categoryBadge(goal.category)">{{ goal.category }}</span>
              </div>
              <h3 class="font-semibold text-slate-800 text-sm">{{ goal.title }}</h3>
              <p *ngIf="goal.dueDate" class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <mat-icon class="text-xs">event</mat-icon>
                Due {{ goal.dueDate | date:'MMM d, y' }}
              </p>
            </div>
            <div class="flex gap-1">
              <button (click)="openForm(goal)" class="p-1 hover:bg-slate-100 rounded-lg">
                <mat-icon class="text-slate-400 text-lg">edit</mat-icon>
              </button>
            </div>
          </div>

          <div class="mt-3">
            <div class="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span><span class="font-semibold">{{ goal.completionPercent }}%</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="goal.completionPercent"
              [color]="goal.completionPercent === 100 ? 'accent' : 'warn'" class="rounded" />
          </div>

          <div class="flex items-center justify-between mt-3">
            <span [class]="'badge ' + statusBadge(goal.status)">{{ goal.status | titlecase }}</span>
            <input type="range" min="0" max="100" step="10"
              [value]="goal.completionPercent"
              (change)="updateProgress(goal, $event)"
              class="w-20 accent-orange-500" />
          </div>
        </div>

        <div *ngIf="goals.length === 0" class="col-span-3 text-center py-16 text-slate-400">
          <mat-icon class="text-4xl">track_changes</mat-icon>
          <p class="mt-2">No goals yet. Add your first goal!</p>
        </div>
      </div>
    </div>
  `,
})
export class GoalsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  goals: any[] = [];
  filterStatus = 'all';
  statusFilters = ['all', 'pending', 'in_progress', 'completed'];

  ngOnInit(): void { this.loadGoals(); }

  loadGoals(): void {
    const params = this.filterStatus !== 'all' ? { status: this.filterStatus } : {};
    this.api.get<any>('/goals', params).subscribe(res => { this.goals = res.data; });
  }

  openForm(goal?: any): void {
    const ref = this.dialog.open(GoalFormComponent, { width: '480px', data: goal });
    ref.afterClosed().subscribe(r => { if (r) this.loadGoals(); });
  }

  updateProgress(goal: any, event: any): void {
    const val = parseInt(event.target.value);
    this.api.put<any>(`/goals/${goal.id}`, { completionPercent: val }).subscribe({
      next: () => { goal.completionPercent = val; },
      error: () => this.toast.error('Update failed'),
    });
  }

  priorityBadge(p: string) { return p === 'high' ? 'badge-red' : p === 'medium' ? 'badge-yellow' : 'badge-blue'; }
  categoryBadge(c: string) { return c === 'learning' ? 'badge-green' : 'badge-gray'; }
  statusBadge(s: string) { const m: any = { completed: 'badge-green', in_progress: 'badge-blue', pending: 'badge-gray', cancelled: 'badge-red' }; return m[s] || 'badge-gray'; }
}
