import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 3500,
      panelClass: ['success-snack'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 4000,
      panelClass: ['error-snack'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  info(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
