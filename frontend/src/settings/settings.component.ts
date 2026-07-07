import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-5">
      <div class="page-header"><h1>Settings</h1><p>System configuration (Admin only)</p></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card flex items-center gap-4">
          <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <mat-icon class="text-blue-500">business</mat-icon>
          </div>
          <div>
            <p class="font-semibold text-slate-800 text-sm">Company Settings</p>
            <p class="text-xs text-slate-400 mt-0.5">Company name, logo, timezone</p>
          </div>
        </div>
        <div class="card flex items-center gap-4">
          <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <mat-icon class="text-orange-500">tune</mat-icon>
          </div>
          <div>
            <p class="font-semibold text-slate-800 text-sm">Performance Cycles</p>
            <p class="text-xs text-slate-400 mt-0.5">Configure review cycles and periods</p>
          </div>
        </div>
        <div class="card flex items-center gap-4">
          <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <mat-icon class="text-emerald-500">notifications_active</mat-icon>
          </div>
          <div>
            <p class="font-semibold text-slate-800 text-sm">Notification Settings</p>
            <p class="text-xs text-slate-400 mt-0.5">Email and in-app notification preferences</p>
          </div>
        </div>
        <div class="card flex items-center gap-4">
          <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <mat-icon class="text-purple-500">security</mat-icon>
          </div>
          <div>
            <p class="font-semibold text-slate-800 text-sm">Security & Audit</p>
            <p class="text-xs text-slate-400 mt-0.5">Password policy, audit logs, sessions</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold text-slate-700 mb-3 text-sm">System Info</h3>
        <div class="space-y-2 text-sm text-slate-600">
          <div class="flex justify-between py-1.5 border-b border-slate-50">
            <span class="text-slate-500">Version</span><span class="font-medium">1.0.0</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-50">
            <span class="text-slate-500">Environment</span><span class="font-medium">Development</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-500">Backend</span>
            <span class="font-medium text-emerald-600 flex items-center gap-1">
              <span class="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span> Running
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {}
