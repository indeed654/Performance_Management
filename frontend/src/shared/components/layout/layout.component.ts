import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden">
      <!-- Sidebar -->
      <app-sidebar
        [collapsed]="sidebarCollapsed()"
        (toggle)="sidebarCollapsed.set(!sidebarCollapsed())" />

      <!-- Main area -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <app-header (menuClick)="sidebarCollapsed.set(!sidebarCollapsed())" />

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
}
