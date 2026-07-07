import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { LeaveFormComponent } from './leave-form/leave-form.component';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between page-header">
        <div><h1>Leave Management</h1><p>Apply and manage leave requests</p></div>
        <button *ngIf="!isAdminOrManager" (click)="openApplyForm()" class="btn-primary flex items-center gap-2">
          <mat-icon class="text-lg">add</mat-icon> Apply Leave
        </button>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 flex-wrap">
        <button *ngFor="let status of statuses" (click)="filterStatus = status; loadLeaves()"
          [class.bg-orange-500]="filterStatus === status"
          [class.text-white]="filterStatus === status"
          [class.bg-white]="filterStatus !== status"
          [class.text-slate-600]="filterStatus !== status"
          class="px-4 py-1.5 rounded-full text-xs font-medium border border-slate-200 transition-colors capitalize">
          {{ status }}
        </button>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden p-0">
        <table class="data-table">
          <thead>
            <tr>
              <th *ngIf="isAdminOrManager">Employee</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Status</th>
              <th>Applied</th>
              <th *ngIf="isAdminOrManager">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let leave of leaves">
              <td *ngIf="isAdminOrManager">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center">
                    <span class="text-orange-600 text-xs font-bold">{{ leave.employee?.firstName?.[0] }}</span>
                  </div>
                  <span class="font-medium text-slate-700">{{ leave.employee?.firstName }} {{ leave.employee?.lastName }}</span>
                </div>
              </td>
              <td class="capitalize font-medium text-slate-700">{{ leave.type }}</td>
              <td>{{ leave.startDate | date:'MMM d, y' }}</td>
              <td>{{ leave.endDate | date:'MMM d, y' }}</td>
              <td>{{ leave.days }} day{{ leave.days > 1 ? 's' : '' }}</td>
              <td>
                <span [class]="'badge ' + statusBadge(leave.status)">{{ leave.status }}</span>
              </td>
              <td class="text-slate-400 text-xs">{{ leave.createdAt | date:'MMM d' }}</td>
              <td *ngIf="isAdminOrManager">
                <div *ngIf="leave.status === 'pending'" class="flex gap-1">
                  <button (click)="approveLeave(leave.id, 'approve')"
                    class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-medium transition-colors">
                    Approve
                  </button>
                  <button (click)="approveLeave(leave.id, 'reject')"
                    class="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium transition-colors">
                    Reject
                  </button>
                </div>
                <span *ngIf="leave.status !== 'pending'" class="text-slate-400 text-xs">—</span>
              </td>
            </tr>
            <tr *ngIf="leaves.length === 0">
              <td [attr.colspan]="isAdminOrManager ? 8 : 6" class="text-center py-10 text-slate-400">
                No leave requests found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class LeavesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  get isAdminOrManager() { return ['admin', 'manager'].includes(this.auth.userRole() || ''); }

  leaves: any[] = [];
  filterStatus = 'all';
  statuses = ['all', 'pending', 'approved', 'rejected'];

  ngOnInit(): void { this.loadLeaves(); }

  loadLeaves(): void {
    const endpoint = this.isAdminOrManager ? '/leaves' : '/leaves/my';
    const params = this.filterStatus !== 'all' ? { status: this.filterStatus } : {};
    this.api.get<any>(endpoint, params).subscribe({
      next: (res) => { this.leaves = res.data || res.data; },
    });
  }

  openApplyForm(): void {
    const ref = this.dialog.open(LeaveFormComponent, { width: '480px' });
    ref.afterClosed().subscribe(r => { if (r) this.loadLeaves(); });
  }

  approveLeave(id: number, action: string): void {
    this.api.put<any>(`/leaves/${id}/approve`, { action }).subscribe({
      next: () => { this.toast.success(`Leave ${action}d`); this.loadLeaves(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed'),
    });
  }

  statusBadge(s: string): string {
    const m: Record<string, string> = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-gray' };
    return m[s] || 'badge-gray';
  }
}
