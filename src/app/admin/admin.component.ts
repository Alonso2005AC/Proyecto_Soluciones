import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product } from '../services/product.service';
import { ApiService } from '../services/api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  products: Product[] = [];
  categories: any[] = [];
  loading: boolean = true;
  activeTab: string = 'productos'; // productos, categorias, ventas, estadisticas
  
  // Analytics
  top: Product | null = null;
  least: Product | null = null;
  withoutRotation: Product[] = [];
  
  // Nuevo producto
  newProduct: any = {
    nombre: '',
    precio: 0,
    stock: 0,
    id_categoria: 0,
    codigo_barras: '',
    descripcion: ''
  };
  
  showAddModal: boolean = false;
  editingProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Cargar productos
    this.productService.clearCache(); // Limpiar caché para datos frescos
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
        this.loadAnalytics();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading = false;
      }
    });
    
    // Cargar categorías
    this.apiService.getCategorias().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  loadAnalytics(): void {
    this.productService.topSelling().subscribe(top => this.top = top);
    this.productService.leastSelling().subscribe(least => this.least = least);
    this.productService.productsWithoutRotation().subscribe(products => {
      this.withoutRotation = products;
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.newProduct = {
      nombre: '',
      precio: 0,
      stock: 0,
      id_categoria: 0,
      codigo_barras: '',
      descripcion: ''
    };
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addProduct(): void {
    if (!this.newProduct.nombre || this.newProduct.precio <= 0) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    this.apiService.createProducto(this.newProduct).subscribe({
      next: () => {
        alert('✅ Producto agregado exitosamente');
        this.closeAddModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al crear producto:', err);
        alert('❌ Error al agregar producto');
      }
    });
  }

  updateProduct(product: Product): void {
    const updateData = {
      nombre: product.name,
      precio: product.price,
      stock: product.stock
    };
    
    this.apiService.updateProducto(product.id, updateData).subscribe({
      next: () => {
        alert('✅ Producto actualizado');
        this.loadData();
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        alert('❌ Error al actualizar producto');
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    
    this.apiService.deleteProducto(product.id).subscribe({
      next: () => {
        alert('✅ Producto eliminado');
        this.loadData();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        alert('❌ Error al eliminar producto');
      }
    });
  }

  getCategoryName(id_categoria?: number): string {
    if (!id_categoria) return 'Sin categoría';
    const cat = this.categories.find(c => c.id_categoria === id_categoria);
    return cat ? cat.nombre_categoria : 'Sin categoría';
  }

  logout(): void {
    if (confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }
}
