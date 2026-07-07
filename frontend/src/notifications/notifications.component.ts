import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between page-header">
        <div><h1>Notifications</h1><p>{{ unreadCount }} unread</p></div>
        <button *ngIf="notifications.length > 0" (click)="markAllRead()" class="btn-secondary text-xs">
          Mark all as read
        </button>
      </div>

      <div class="space-y-2">
        <div *ngFor="let n of notifications"
          [class.bg-orange-50]="!n.isRead"
          class="card py-3 px-4 flex items-start gap-3 cursor-pointer hover:shadow-card-hover transition-all"
          (click)="markRead(n)">
          <div [class]="'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ' + iconBg(n.type)">
            <mat-icon [class]="'text-lg ' + iconColor(n.type)">{{ iconName(n.type) }}</mat-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-slate-800">{{ n.title }}</p>
              <span class="text-xs text-slate-400 flex-shrink-0">{{ n.createdAt | date:'MMM d, h:mm a' }}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ n.message }}</p>
          </div>
          <div *ngIf="!n.isRead" class="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5"></div>
          <button (click)="deleteNotif(n, $event)" class="p-1 hover:bg-red-50 rounded-lg flex-shrink-0">
            <mat-icon class="text-slate-300 hover:text-red-400 text-lg">close</mat-icon>
          </button>
        </div>

        <div *ngIf="notifications.length === 0" class="text-center py-20 text-slate-400">
          <mat-icon class="text-5xl">notifications_off</mat-icon>
          <p class="mt-2">No notifications</p>
        </div>
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  notifications: any[] = [];
  unreadCount = 0;

  ngOnInit(): void { this.loadNotifications(); }

  loadNotifications(): void {
    this.api.get<any>('/notifications').subscribe(res => {
      this.notifications = res.data.notifications;
      this.unreadCount = res.data.unreadCount;
    });
  }

  markRead(n: any): void {
    if (n.isRead) return;
    this.api.put<any>(`/notifications/${n.id}/read`, {}).subscribe(() => {
      n.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }

  markAllRead(): void {
    this.api.put<any>('/notifications/all/read', {}).subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    });
  }

  deleteNotif(n: any, e: Event): void {
    e.stopPropagation();
    this.api.delete<any>(`/notifications/${n.id}`).subscribe(() => {
      this.notifications = this.notifications.filter(x => x.id !== n.id);
      if (!n.isRead) this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }

  iconName(type: string): string {
    const m: any = { info: 'info', success: 'check_circle', warning: 'warning', leave: 'event_busy', review: 'rate_review', task: 'assignment', birthday: 'cake' };
    return m[type] || 'notifications';
  }
  iconBg(type: string): string {
    const m: any = { success: 'bg-emerald-50', warning: 'bg-amber-50', leave: 'bg-orange-50', review: 'bg-blue-50', birthday: 'bg-pink-50' };
    return m[type] || 'bg-slate-100';
  }
  iconColor(type: string): string {
    const m: any = { success: 'text-emerald-500', warning: 'text-amber-500', leave: 'text-orange-500', review: 'text-blue-500', birthday: 'text-pink-500' };
    return m[type] || 'text-slate-500';
  }
}
