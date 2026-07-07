import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressBarModule],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div class="page-header">
        <h1>{{ getGreeting() }}, {{ user()?.firstName }} 👋</h1>
        <p>Here's what's happening with your team today.</p>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div *ngFor="let i of [1,2,3,4]" class="card animate-pulse h-28 bg-slate-100 rounded-xl"></div>
      </div>

      <!-- Admin / Manager dashboard -->
      <ng-container *ngIf="!loading && (isAdmin || isManager)">
        <!-- Stats cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="card flex items-center gap-4" *ngFor="let stat of stats">
            <div [class]="'w-12 h-12 rounded-xl flex items-center justify-center ' + stat.bg">
              <mat-icon [class]="stat.iconColor">{{ stat.icon }}</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ stat.value }}</p>
              <p class="text-xs text-slate-500 font-medium">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top performers -->
          <div class="card">
            <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <mat-icon class="text-orange-500 text-lg">emoji_events</mat-icon>
              Top Performers
            </h3>
            <div *ngIf="topPerformers.length === 0" class="text-center py-8 text-slate-400">
              <mat-icon class="text-4xl">insights</mat-icon>
              <p class="text-sm mt-2">No review data yet</p>
            </div>
            <div class="space-y-3">
              <div *ngFor="let p of topPerformers; let i = index"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <span [class]="'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ' +
                  (i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600')">
                  {{ i + 1 }}
                </span>
                <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span class="text-orange-600 text-xs font-bold">
                    {{ p.employee?.firstName?.[0] }}{{ p.employee?.lastName?.[0] }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-700 truncate">
                    {{ p.employee?.firstName }} {{ p.employee?.lastName }}
                  </p>
                  <p class="text-xs text-slate-400 truncate">{{ p.employee?.designation }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span class="text-sm font-bold text-orange-500">{{ p.finalScore }}/5</span>
                  <mat-progress-bar mode="determinate" [value]="(p.finalScore / 5) * 100"
                    class="w-16 mt-1 rounded" color="warn" />
                </div>
              </div>
            </div>
          </div>

          <!-- Recent joins -->
          <div class="card">
            <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <mat-icon class="text-blue-500 text-lg">person_add</mat-icon>
              Recent Joins
            </h3>
            <div class="space-y-3">
              <div *ngFor="let emp of recentJoins"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div class="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-blue-600 text-xs font-bold">
                    {{ emp.firstName?.[0] }}{{ emp.lastName?.[0] }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-700 truncate">
                    {{ emp.firstName }} {{ emp.lastName }}
                  </p>
                  <p class="text-xs text-slate-400 truncate">
                    {{ emp.designation }} · {{ emp.department?.name }}
                  </p>
                </div>
                <span class="text-xs text-slate-400 flex-shrink-0">
                  {{ emp.createdAt | date:'MMM d' }}
                </span>
              </div>
              <p *ngIf="recentJoins.length === 0" class="text-slate-400 text-sm text-center py-4">
                No new joins this month
              </p>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Employee dashboard -->
      <ng-container *ngIf="!loading && isEmployee">
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="card flex items-center gap-4">
            <div class="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <mat-icon class="text-orange-500">flag</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ empStats?.pendingKRAs }}</p>
              <p class="text-xs text-slate-500 font-medium">Pending KRAs</p>
            </div>
          </div>
          <div class="card flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <mat-icon class="text-blue-500">track_changes</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ empStats?.pendingGoals }}</p>
              <p class="text-xs text-slate-500 font-medium">Active Goals</p>
            </div>
          </div>
          <div class="card flex items-center gap-4">
            <div class="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <mat-icon class="text-purple-500">assignment</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ empStats?.pendingTasks }}</p>
              <p class="text-xs text-slate-500 font-medium">Open Tasks</p>
            </div>
          </div>
          <div class="card flex items-center gap-4">
            <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <mat-icon class="text-emerald-500">schedule</mat-icon>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-700">Today's Attendance</p>
              <p class="text-xs text-slate-400 mt-1">
                {{ todayAttendance?.checkIn ? 'In: ' + todayAttendance.checkIn : 'Not checked in' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Upcoming goals -->
        <div class="card">
          <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <mat-icon class="text-orange-500 text-lg">upcoming</mat-icon>
            Upcoming Goals
          </h3>
          <div class="space-y-3">
            <div *ngFor="let goal of upcomingGoals"
              class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-slate-700">{{ goal.title }}</p>
                <p class="text-xs text-slate-400 mt-0.5">Due: {{ goal.dueDate | date:'MMM d, y' }}</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <p class="text-xs text-slate-500 mb-1">{{ goal.completionPercent }}%</p>
                  <mat-progress-bar mode="determinate" [value]="goal.completionPercent" class="w-20 rounded" />
                </div>
                <span [class]="'badge ' + priorityBadge(goal.priority)">{{ goal.priority }}</span>
              </div>
            </div>
            <p *ngIf="upcomingGoals.length === 0" class="text-slate-400 text-sm text-center py-4">
              No upcoming goals
            </p>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  user = this.auth.currentUser;
  loading = true;

  get isAdmin() { return this.user()?.role === 'admin'; }
  get isManager() { return this.user()?.role === 'manager'; }
  get isEmployee() { return this.user()?.role === 'employee'; }

  // Admin/Manager data
  stats: any[] = [];
  topPerformers: any[] = [];
  recentJoins: any[] = [];

  // Employee data
  empStats: any = null;
  todayAttendance: any = null;
  upcomingGoals: any[] = [];

  ngOnInit(): void {
    const role = this.user()?.role;
    if (role === 'admin') this.loadAdminDash();
    else if (role === 'manager') this.loadManagerDash();
    else this.loadEmployeeDash();
  }

  loadAdminDash(): void {
    this.api.get<any>('/dashboard/admin').subscribe({
      next: (res) => {
        const d = res.data;
        this.stats = [
          { label: 'Total Employees', value: d.stats.totalEmployees, icon: 'people', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
          { label: 'Managers', value: d.stats.totalManagers, icon: 'manage_accounts', bg: 'bg-purple-50', iconColor: 'text-purple-500' },
          { label: 'Present Today', value: d.stats.presentToday, icon: 'check_circle', bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
          { label: 'Pending Leaves', value: d.stats.pendingLeaves, icon: 'event_busy', bg: 'bg-orange-50', iconColor: 'text-orange-500' },
        ];
        this.topPerformers = d.topPerformers;
        this.recentJoins = d.recentJoins;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadManagerDash(): void {
    this.api.get<any>('/dashboard/manager').subscribe({
      next: (res) => {
        const d = res.data;
        this.stats = [
          { label: 'Team Members', value: d.teamCount, icon: 'group', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
          { label: 'Present Today', value: d.presentCount, icon: 'check_circle', bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
          { label: 'Pending Leaves', value: d.pendingLeaves, icon: 'event_busy', bg: 'bg-orange-50', iconColor: 'text-orange-500' },
          { label: 'Pending Reviews', value: d.pendingReviews, icon: 'rate_review', bg: 'bg-purple-50', iconColor: 'text-purple-500' },
        ];
        this.recentJoins = d.recentLeaves;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadEmployeeDash(): void {
    this.api.get<any>('/dashboard/employee').subscribe({
      next: (res) => {
        const d = res.data;
        this.empStats = d.stats;
        this.todayAttendance = d.todayAttendance;
        this.upcomingGoals = d.upcomingGoals;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  priorityBadge(priority: string): string {
    const map: Record<string, string> = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue' };
    return map[priority] || 'badge-gray';
  }
}
