import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-5">
      <div class="page-header"><h1>Attendance</h1><p>Track your daily attendance</p></div>

      <!-- Check-in card -->
      <div *ngIf="!isAdmin" class="card">
        <div class="flex flex-wrap items-center gap-5">
          <div class="flex-1">
            <p class="text-sm font-semibold text-slate-700 mb-1">Today — {{ today | date:'EEEE, MMMM d, y' }}</p>
            <div class="flex gap-4 text-sm text-slate-600">
              <span class="flex items-center gap-1">
                <mat-icon class="text-sm text-emerald-500">login</mat-icon>
                Check In: {{ todayRecord?.checkIn || '—' }}
              </span>
              <span class="flex items-center gap-1">
                <mat-icon class="text-sm text-red-500">logout</mat-icon>
                Check Out: {{ todayRecord?.checkOut || '—' }}
              </span>
              <span *ngIf="todayRecord?.workingHours" class="flex items-center gap-1">
                <mat-icon class="text-sm text-blue-500">timer</mat-icon>
                {{ todayRecord.workingHours }}h
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="checkIn()"
              [disabled]="!!todayRecord?.checkIn || actionLoading"
              class="btn-primary disabled:opacity-50 flex items-center gap-1.5">
              <mat-icon class="text-lg">login</mat-icon> Check In
            </button>
            <button (click)="checkOut()"
              [disabled]="!todayRecord?.checkIn || !!todayRecord?.checkOut || actionLoading"
              class="btn-secondary disabled:opacity-50 flex items-center gap-1.5">
              <mat-icon class="text-lg">logout</mat-icon> Check Out
            </button>
          </div>
        </div>

        <!-- Monthly summary -->
        <div *ngIf="summary" class="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-emerald-600">{{ summary.present }}</p>
            <p class="text-xs text-slate-500 font-medium">Present</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-red-500">{{ summary.absent }}</p>
            <p class="text-xs text-slate-500 font-medium">Absent</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-amber-500">{{ summary.late }}</p>
            <p class="text-xs text-slate-500 font-medium">Late</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-500">{{ summary.totalWorkingHours }}h</p>
            <p class="text-xs text-slate-500 font-medium">Total Hours</p>
          </div>
        </div>
      </div>

      <!-- Month filter -->
      <div class="flex gap-3">
        <select [(ngModel)]="selectedMonth" (ngModelChange)="loadAttendance()"
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
        </select>
        <select [(ngModel)]="selectedYear" (ngModelChange)="loadAttendance()"
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option *ngFor="let y of years" [value]="y">{{ y }}</option>
        </select>
      </div>

      <!-- Attendance table -->
      <div class="card overflow-hidden p-0">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th *ngIf="isAdmin">Employee</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of records">
                <td class="font-medium">{{ r.date | date:'EEE, MMM d' }}</td>
                <td *ngIf="isAdmin">{{ r.user?.firstName }} {{ r.user?.lastName }}</td>
                <td>{{ r.checkIn || '—' }}</td>
                <td>{{ r.checkOut || '—' }}</td>
                <td>{{ r.workingHours ? r.workingHours + 'h' : '—' }}</td>
                <td><span [class]="'badge ' + statusBadge(r.status)">{{ r.status | titlecase }}</span></td>
              </tr>
              <tr *ngIf="records.length === 0">
                <td [attr.colspan]="isAdmin ? 6 : 5" class="text-center py-10 text-slate-400">
                  No attendance records for this period
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AttendanceComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin() { return ['admin', 'manager'].includes(this.auth.userRole() || ''); }

  today = new Date();
  todayRecord: any = null;
  summary: any = null;
  records: any[] = [];
  loading = false;
  actionLoading = false;

  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  years = [2024, 2025, 2026];

  ngOnInit(): void {
    this.loadTodayStatus();
    this.loadAttendance();
  }

  loadTodayStatus(): void {
    this.api.get<any>('/attendance/today').subscribe(res => {
      this.todayRecord = res.data;
    });
  }

  loadAttendance(): void {
    const endpoint = this.isAdmin ? '/attendance' : '/attendance/my';
    this.api.get<any>(endpoint, { month: this.selectedMonth, year: this.selectedYear }).subscribe({
      next: (res) => {
        if (this.isAdmin) {
          this.records = res.data;
        } else {
          this.records = res.data.records;
          this.summary = res.data.summary;
        }
      },
    });
  }

  checkIn(): void {
    this.actionLoading = true;
    this.api.post<any>('/attendance/checkin', {}).subscribe({
      next: (res) => { this.todayRecord = res.data; this.toast.success('Checked in!'); this.loadAttendance(); this.actionLoading = false; },
      error: (err) => { this.toast.error(err.error?.message || 'Check-in failed'); this.actionLoading = false; },
    });
  }

  checkOut(): void {
    this.actionLoading = true;
    this.api.post<any>('/attendance/checkout', {}).subscribe({
      next: (res) => { this.todayRecord = res.data; this.toast.success('Checked out!'); this.loadAttendance(); this.actionLoading = false; },
      error: (err) => { this.toast.error(err.error?.message || 'Check-out failed'); this.actionLoading = false; },
    });
  }

  statusBadge(s: string): string {
    const m: Record<string, string> = { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', half_day: 'badge-blue' };
    return m[s] || 'badge-gray';
  }
}
