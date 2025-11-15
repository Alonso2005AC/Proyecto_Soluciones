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
      <div class="logo-container">
        <img src="assets/img/Mass.png" alt="Logo Tienda Mass" class="nav-logo" />
      </div>
      <div class="nav-actions">
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
      height: 60px;
      background-color: #FFD700;
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .logo-container {
      height: 100%;
      display: flex;
      align-items: center;
    }

    .nav-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cart-button {
      position: relative;
      padding: 10px 16px;
      background: white;
      border: 2px solid #000;
      border-radius: 8px;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #1f2937;
    }

    .cart-button:hover {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
      transform: translateY(-2px);
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #dc2626;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      border: 2px solid #FFD700;
    }

    .logout-button {
      padding: 10px 16px;
      background: #1f2937;
      color: white;
      border: 2px solid #000;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .logout-button:hover {
      background: #dc2626;
      transform: translateY(-2px);
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

  logout(): void {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('cart');
      this.router.navigate(['/login']);
    }
  }
}