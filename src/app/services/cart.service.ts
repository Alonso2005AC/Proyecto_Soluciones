import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  
  cartItems$ = this.cartItems.asObservable();

  constructor() {
    // Cargar carrito desde localStorage al iniciar
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems.next(JSON.parse(savedCart));
    }
  }

  getCart(): CartItem[] {
    return this.cartItems.value;
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.cartItems.value;
    const existingItem = currentCart.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.push({ product, quantity });
    }

    this.cartItems.next(currentCart);
    this.saveCart();
  }

  updateQuantity(productId: number, quantity: number): void {
    const currentCart = this.cartItems.value;
    const item = currentCart.find(item => item.product.id === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.cartItems.next(currentCart);
        this.saveCart();
      }
    }
  }

  removeFromCart(productId: number): void {
    const currentCart = this.cartItems.value.filter(
      item => item.product.id !== productId
    );
    this.cartItems.next(currentCart);
    this.saveCart();
  }

  clearCart(): void {
    this.cartItems.next([]);
    this.saveCart();
  }

  getTotal(): number {
    return this.cartItems.value.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  getItemCount(): number {
    return this.cartItems.value.reduce(
      (count, item) => count + item.quantity,
      0
    );
  }

  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
  }
}
