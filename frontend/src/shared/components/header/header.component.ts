import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatMenuModule, MatButtonModule, MatBadgeModule, MatDividerModule],
  template: `
    <header class="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <!-- Menu toggle -->
      <button (click)="menuClick.emit()" class="p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <mat-icon class="text-slate-500">menu</mat-icon>
      </button>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <!-- Notifications -->
        <a routerLink="/notifications" class="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <mat-icon class="text-slate-500">notifications</mat-icon>
          <span *ngIf="unreadCount > 0"
            class="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </a>

        <!-- Profile menu -->
        <button [matMenuTriggerFor]="profileMenu"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span class="text-orange-600 font-semibold text-xs">
              {{ user()?.firstName?.[0] }}{{ user()?.lastName?.[0] }}
            </span>
          </div>
          <span class="text-sm font-medium text-slate-700 hidden sm:block">
            {{ user()?.firstName }}
          </span>
          <mat-icon class="text-slate-400 text-lg">arrow_drop_down</mat-icon>
        </button>

        <mat-menu #profileMenu="matMenu" xPosition="before">
          <a mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon> My Profile
          </a>
          <a mat-menu-item routerLink="/notifications">
            <mat-icon>notifications</mat-icon> Notifications
          </a>
          <mat-divider />
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon> Logout
          </button>
        </mat-menu>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  @Output() menuClick = new EventEmitter<void>();

  private auth = inject(AuthService);
  private api = inject(ApiService);

  user = this.auth.currentUser;
  unreadCount = 0;

  ngOnInit(): void {
    this.loadUnreadCount();
  }

  loadUnreadCount(): void {
    this.api.get<any>('/notifications').subscribe(res => {
      this.unreadCount = res.data?.unreadCount ?? 0;
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
