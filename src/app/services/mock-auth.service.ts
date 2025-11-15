import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class MockAuthService {
  private client = { email: 'cliente@ejemplo.com', password: 'cliente123', name: 'Cliente Demo' };
  private admin = { code: 'ADMIN1234', name: 'Administrador' };

  constructor(private router: Router) {}

  loginClient(email: string, password: string): boolean {
    if (email === this.client.email && password === this.client.password) {
      localStorage.setItem('mock_user', JSON.stringify({ role: 'client', name: this.client.name, email }));
      return true;
    }
    return false;
  }

  loginAdmin(code: string): boolean {
    if (code === this.admin.code) {
      localStorage.setItem('mock_user', JSON.stringify({ role: 'admin', name: this.admin.name, code }));
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem('mock_user');
    this.router.navigate(['/login']);
  }

  getCurrentUser() {
    const raw = localStorage.getItem('mock_user');
    return raw ? JSON.parse(raw) : null;
  }
}
