import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product } from '../services/product.service';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { FooterComponent } from '../components/footer/footer.component';

@Component({
  standalone: true,
  imports: [CommonModule, NavBarComponent, FooterComponent, FormsModule],
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading: boolean = true;
  error: string = '';
  
  // Filtros
  searchTerm: string = '';
  selectedCategory: number = 0; // 0 = todas
  minPrice: number = 0;
  maxPrice: number = 100;
  priceRange: number = 100;
  
  // Carrito
  cart: any[] = [];
  
  // Categorías desde el backend
  categories: any[] = [];

  constructor(
    private productService: ProductService,
    private apiService: ApiService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 Iniciando carga de datos...');
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Cargar productos y categorías en paralelo
    console.log('🔄 Cargando productos y categorías...');
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log(`✅ ${products.length} productos recibidos`);
        
        if (!products || products.length === 0) {
          this.error = 'No hay productos disponibles';
          this.loading = false;
          return;
        }
        
        this.products = products;
        this.filteredProducts = [...products];
        this.loading = false;
        
        // Calcular precio máximo
        if (products.length > 0) {
          this.maxPrice = Math.max(...products.map(p => p.price));
          this.priceRange = this.maxPrice;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar productos. Verifica que el backend esté en http://localhost:8080';
        this.loading = false;
        console.error('❌ Error productos:', err);
      }
    });
    
    // Cargar categorías en paralelo
    this.apiService.getCategorias().subscribe({
      next: (cats) => {
        this.categories = cats;
        console.log(`✅ ${cats.length} categorías cargadas`);
      },
      error: (err) => {
        console.error('❌ Error categorías:', err);
        // Usar categorías por defecto
        this.categories = [
          { id_categoria: 1, nombre_categoria: 'Verduras' },
          { id_categoria: 2, nombre_categoria: 'Frutas' },
          { id_categoria: 3, nombre_categoria: 'Lacteos' }
        ];
      }
    });
  }
  
  applyFilters(): void {
    if (!this.products || this.products.length === 0) {
      this.filteredProducts = [];
      return;
    }
    
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = !this.searchTerm || 
                           product.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesPrice = product.price <= this.priceRange;
      const selectedCat = Number(this.selectedCategory);
      const productCat = product.id_categoria ? Number(product.id_categoria) : 0;
      const matchesCategory = selectedCat === 0 || productCat === selectedCat;
      
      return matchesSearch && matchesPrice && matchesCategory;
    });
    
    console.log(`🔍 Filtrados: ${this.filteredProducts.length}/${this.products.length} productos`);
  }
  
  onSearchChange(): void {
    this.applyFilters();
  }
  
  onPriceChange(): void {
    this.applyFilters();
  }
  
  onCategoryChange(): void {
    // Convertir a número para asegurar comparación correcta
    this.selectedCategory = Number(this.selectedCategory);
    console.log('Categoría seleccionada:', this.selectedCategory);
    this.applyFilters();
  }
  
  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    this.showToast(`${product.name} agregado al carrito`, 'success');
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product', productId]);
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
  
  getStars(rating: number = 4.5): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getProductImage(product: Product): string {
    if (product.imagen) {
      return product.imagen;
    }
    
    // Placeholders basados en categoría
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
    return `https://via.placeholder.com/300x300/${color}/000000?text=${encodeURIComponent(product.name)}`;
  }
}
