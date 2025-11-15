import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="nav-bar">
      <div class="logo-container" (click)="goHome()">
        <img src="assets/img/Mass.png" alt="Logo Tienda Mass" class="nav-logo" />
        <div class="brand-text">
          <span class="brand-name">TIENDA MASS</span>
          <span class="brand-tagline">Tu tienda de confianza</span>
        </div>
      </div>
      <div class="nav-actions">
        <button class="icon-button" (click)="goToHistorial()" title="Mis compras">
          <i class="fa-solid fa-receipt"></i>
        </button>
        <button class="cart-button" (click)="goToCart()">
          <i class="fa-solid fa-shopping-cart"></i>
          <span class="cart-badge" *ngIf="cartItemCount > 0">{{ cartItemCount }}</span>
        </button>
        <button class="logout-button" (click)="logout()">
          <i class="fa-solid fa-sign-out-alt"></i> Cerrar sesión
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .nav-bar {
      width: 100%;
      min-width: 100vw;
      box-sizing: border-box;
      height: 70px;
      background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%);
      border-bottom: 3px solid #000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 30px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .logo-container {
      height: 100%;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 10px 0;
    }

    .logo-container:hover {
      transform: scale(1.05);
    }

    .logo-container:hover .nav-logo {
      transform: rotate(-5deg) scale(1.1);
    }

    .nav-logo {
      height: 50px;
      width: auto;
      object-fit: contain;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 900;
      color: #1f2937;
      letter-spacing: 1px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
      line-height: 1;
    }

    .brand-tagline {
      font-size: 0.75rem;
      color: #374151;
      font-weight: 600;
      letter-spacing: 0.5px;
      opacity: 0.9;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-button {
      padding: 12px 18px;
      background: white;
      border: 2px solid #000;
      border-radius: 10px;
      font-size: 1.3rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #1f2937;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .icon-button:hover {
      background: #10b981;
      color: white;
      border-color: #10b981;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .icon-button:active {
      transform: translateY(-1px);
    }

    .cart-button {
      position: relative;
      padding: 12px 18px;
      background: white;
      border: 2px solid #000;
      border-radius: 10px;
      font-size: 1.3rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #1f2937;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .cart-button:hover {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .cart-button:active {
      transform: translateY(-1px);
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #dc2626;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      border: 2px solid #FFD700;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    .logout-button {
      padding: 12px 20px;
      background: #1f2937;
      color: white;
      border: 2px solid #000;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .logout-button:hover {
      background: #dc2626;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
    }

    .logout-button:active {
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .nav-bar {
        height: 60px;
        padding: 0 15px;
      }

      .brand-text {
        display: none;
      }

      .nav-logo {
        height: 40px;
      }

      .logout-button span {
        display: none;
      }
    }
  `]
})
export class NavBarComponent implements OnInit {
  cartItemCount: number = 0;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItemCount = items.reduce((count, item) => count + item.quantity, 0);
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToHistorial(): void {
    this.router.navigate(['/historial']);
  }

  goHome(): void {
    this.router.navigate(['/client']);
  }

  logout(): void {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('cart');
      this.router.navigate(['/login']);
    }
  }
}