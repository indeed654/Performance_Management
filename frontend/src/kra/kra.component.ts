import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { KraFormComponent } from './kra-form/kra-form.component';

@Component({
  selector: 'app-kra',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressBarModule, MatDialogModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between page-header">
        <div><h1>Key Result Areas</h1><p>Track performance objectives and achievements</p></div>
        <button *ngIf="!isEmployee" (click)="openForm()" class="btn-primary flex items-center gap-2">
          <mat-icon class="text-lg">add</mat-icon> Assign KRA
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-3 flex-wrap">
        <select [(ngModel)]="filters.quarter" (ngModelChange)="loadKRAs()"
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="">All Quarters</option>
          <option *ngFor="let q of ['Q1','Q2','Q3','Q4']" [value]="q">{{ q }}</option>
        </select>
        <select [(ngModel)]="filters.status" (ngModelChange)="loadKRAs()"
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="">All Status</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <!-- KRA Cards -->
      <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let i of [1,2,3,4]" class="card animate-pulse h-40 bg-slate-100 rounded-xl"></div>
      </div>

      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let kra of kras" class="card hover:shadow-card-hover transition-shadow">
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-blue text-xs">{{ kra.quarter }} {{ kra.year }}</span>
                <span [class]="'badge ' + weightageColor(kra.weightage)">{{ kra.weightage }}%</span>
              </div>
              <h3 class="font-semibold text-slate-800 text-sm leading-tight">{{ kra.title }}</h3>
              <p *ngIf="!isEmployee" class="text-xs text-slate-400 mt-0.5">
                {{ kra.employee?.firstName }} {{ kra.employee?.lastName }}
              </p>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button (click)="openForm(kra)" class="p-1.5 hover:bg-slate-100 rounded-lg">
                <mat-icon class="text-slate-400 text-lg">edit</mat-icon>
              </button>
              <button *ngIf="!isEmployee" (click)="deleteKRA(kra.id)" class="p-1.5 hover:bg-red-50 rounded-lg">
                <mat-icon class="text-slate-400 hover:text-red-500 text-lg">delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="space-y-2 text-xs text-slate-600">
            <div class="flex justify-between">
              <span class="text-slate-500">Target:</span>
              <span class="font-medium">{{ kra.target }}</span>
            </div>
            <div *ngIf="kra.achievement" class="flex justify-between">
              <span class="text-slate-500">Achievement:</span>
              <span class="font-medium text-emerald-600">{{ kra.achievement }}</span>
            </div>
          </div>

          <div class="mt-3">
            <div class="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span class="font-semibold">{{ kra.completionPercent }}%</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="kra.completionPercent"
              [color]="kra.completionPercent === 100 ? 'accent' : 'warn'" class="rounded" />
          </div>

          <div class="flex items-center justify-between mt-3">
            <span [class]="'badge ' + statusBadge(kra.status)">{{ kra.status | titlecase }}</span>
            <input *ngIf="isEmployee || !isEmployee" type="range" min="0" max="100" step="5"
              [value]="kra.completionPercent"
              (change)="updateProgress(kra, $event)"
              class="w-24 accent-orange-500" />
          </div>
        </div>

        <div *ngIf="kras.length === 0" class="col-span-2 text-center py-16 text-slate-400">
          <mat-icon class="text-4xl">flag</mat-icon>
          <p class="mt-2">No KRAs found</p>
        </div>
      </div>
    </div>
  `,
})
export class KraComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  get isEmployee() { return this.auth.userRole() === 'employee'; }

  kras: any[] = [];
  loading = true;
  filters = { quarter: '', status: '' };

  ngOnInit(): void { this.loadKRAs(); }

  loadKRAs(): void {
    this.loading = true;
    this.api.get<any>('/kras', this.filters).subscribe({
      next: (res) => { this.kras = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openForm(kra?: any): void {
    const ref = this.dialog.open(KraFormComponent, { width: '520px', data: kra });
    ref.afterClosed().subscribe(r => { if (r) this.loadKRAs(); });
  }

  deleteKRA(id: number): void {
    if (!confirm('Delete this KRA?')) return;
    this.api.delete<any>(`/kras/${id}`).subscribe({
      next: () => { this.toast.success('KRA deleted'); this.loadKRAs(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed'),
    });
  }

  updateProgress(kra: any, event: any): void {
    const val = parseInt(event.target.value);
    this.api.put<any>(`/kras/${kra.id}`, { completionPercent: val }).subscribe({
      next: () => { kra.completionPercent = val; if (val === 100) kra.status = 'completed'; },
      error: (err) => this.toast.error(err.error?.message || 'Update failed'),
    });
  }

  weightageColor(w: number): string {
    if (w >= 30) return 'badge-red';
    if (w >= 20) return 'badge-yellow';
    return 'badge-blue';
  }

  statusBadge(s: string): string {
    const m: Record<string, string> = { completed: 'badge-green', in_progress: 'badge-blue', not_started: 'badge-gray', on_hold: 'badge-yellow' };
    return m[s] || 'badge-gray';
  }
}
