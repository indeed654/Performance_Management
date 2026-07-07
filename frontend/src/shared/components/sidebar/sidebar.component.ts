import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    icon: 'dashboard',    route: '/dashboard',    roles: ['admin', 'manager', 'employee'] },
  { label: 'Employees',    icon: 'people',       route: '/employees',    roles: ['admin', 'manager'] },
  { label: 'Departments',  icon: 'business',     route: '/departments',  roles: ['admin'] },
  { label: 'Attendance',   icon: 'schedule',     route: '/attendance',   roles: ['admin', 'manager', 'employee'] },
  { label: 'Leaves',       icon: 'event_busy',   route: '/leaves',       roles: ['admin', 'manager', 'employee'] },
  { label: 'KRA',          icon: 'flag',         route: '/kra',          roles: ['admin', 'manager', 'employee'] },
  { label: 'Goals',        icon: 'track_changes',route: '/goals',        roles: ['admin', 'manager', 'employee'] },
  { label: 'Performance',  icon: 'insights',     route: '/performance',  roles: ['admin', 'manager', 'employee'] },
  { label: 'Notifications',icon: 'notifications',route: '/notifications',roles: ['admin', 'manager', 'employee'] },
  { label: 'Settings',     icon: 'settings',     route: '/settings',     roles: ['admin'] },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  template: `
    <aside
      [class.w-16]="collapsed"
      [class.w-60]="!collapsed"
      class="flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300 shadow-sm flex-shrink-0">

      <!-- Logo -->
      <div class="flex items-center h-16 px-4 border-b border-slate-100 flex-shrink-0">
        <div class="flex items-center gap-2 overflow-hidden">
          <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-sm">P</span>
          </div>
          <span *ngIf="!collapsed" class="font-semibold text-slate-800 whitespace-nowrap">PMS</span>
        </div>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <a
          *ngFor="let item of visibleItems()"
          [routerLink]="item.route"
          routerLinkActive="bg-orange-50 text-orange-600"
          [routerLinkActiveOptions]="{ exact: false }"
          [matTooltip]="collapsed ? item.label : ''"
          matTooltipPosition="right"
          class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors group"
          [class.justify-center]="collapsed"
          [class.px-3]="collapsed">
          <mat-icon class="text-xl flex-shrink-0 group-[.active]:text-orange-500">{{ item.icon }}</mat-icon>
          <span *ngIf="!collapsed" class="text-sm font-medium whitespace-nowrap">{{ item.label }}</span>
        </a>
      </nav>

      <!-- User info at bottom -->
      <div *ngIf="!collapsed" class="p-4 border-t border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-orange-600 font-semibold text-xs">
              {{ user()?.firstName?.[0] }}{{ user()?.lastName?.[0] }}
            </span>
          </div>
          <div class="overflow-hidden">
            <p class="text-xs font-semibold text-slate-700 truncate">{{ user()?.firstName }} {{ user()?.lastName }}</p>
            <p class="text-xs text-slate-400 capitalize">{{ user()?.role }}</p>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  private auth = inject(AuthService);
  user = this.auth.currentUser;

  visibleItems = computed(() => {
    const role = this.auth.userRole();
    return NAV_ITEMS.filter(item => role && item.roles.includes(role));
  });
}
