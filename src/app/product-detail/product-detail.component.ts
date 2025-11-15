import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { FooterComponent } from '../components/footer/footer.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, NavBarComponent, FooterComponent, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  loading: boolean = true;
  quantity: number = 1;
  selectedImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      this.loadProduct(id);
    });
  }

  loadProduct(id: number): void {
    this.loading = true;
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.product = products.find(p => p.id === id) || null;
        
        if (this.product) {
          this.selectedImage = this.getProductImage(this.product);
          this.loadRelatedProducts(this.product.id_categoria || 0);
        } else {
          this.showToast('Producto no encontrado', 'error');
          this.router.navigate(['/client']);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar producto:', err);
        this.showToast('Error al cargar el producto', 'error');
        this.loading = false;
      }
    });
  }

  loadRelatedProducts(categoryId: number): void {
    if (!categoryId) return;
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.relatedProducts = products
          .filter(p => p.id_categoria === categoryId && p.id !== this.product?.id)
          .slice(0, 4); // Máximo 4 productos relacionados
      },
      error: (err) => {
        console.error('Error al cargar productos relacionados:', err);
      }
    });
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.showToast(`${this.quantity} x ${this.product.name} agregado al carrito`, 'success');
      this.quantity = 1;
    }
  }

  buyNow(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.router.navigate(['/cart']);
    }
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product', productId]);
    window.scrollTo(0, 0);
  }

  goBack(): void {
    this.router.navigate(['/client']);
  }

  getProductImage(product: Product): string {
    if (product.imagen) {
      return product.imagen;
    }
    
    const categoryColors: any = {
      'Verduras': 'FFD700',
      'Frutas': 'FFA500',
      'Lacteos': 'FFFFFF',
      'Lácteos': 'FFFFFF',
      'Carnes': 'FF6B6B',
      'Bebidas': '00CED1',
      'Abarrotes': 'DEB887'
    };
    
    const color = categoryColors[product.categoria || ''] || 'FFC107';
    return `https://via.placeholder.com/600x600/${color}/000000?text=${encodeURIComponent(product.name)}`;
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
      <div class="toast-message">${message}</div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
