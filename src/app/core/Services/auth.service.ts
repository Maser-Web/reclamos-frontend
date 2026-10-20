import { Injectable, signal } from '@angular/core';

export interface LoginCredentials {
  usuario: string;
  contrasena: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authenticated = signal(false);
  readonly isAuthenticated = this.authenticated.asReadonly();

  login({ usuario, contrasena }: LoginCredentials): boolean {
    const accepted = usuario.trim().toLowerCase() === 'admin' && contrasena === 'coronel2026';
    this.authenticated.set(accepted);
    return accepted;
  }

  logout(): void {
    this.authenticated.set(false);
  }
}
