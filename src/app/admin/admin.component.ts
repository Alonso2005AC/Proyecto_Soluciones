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
      stock: product.stock,
      id_categoria: product.id_categoria || null,
      codigo_barras: product.codigo_barras || '',
      descripcion: product.descripcion || '',
      imagen: product.imagen || null,
      fecha_registro: product.fecha_registro || new Date().toISOString().split('T')[0],
      fecha_vencimiento: product.fecha_vencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lote: product.lote || 'L-MAS-001'
    };
    
    console.log('📝 Actualizando producto ID:', product.id);
    console.log('📦 Datos enviados:', JSON.stringify(updateData, null, 2));
    
    this.apiService.updateProducto(product.id, updateData).subscribe({
      next: (response) => {
        console.log('✅ Respuesta exitosa:', response);
        alert('✅ Producto actualizado');
        this.loadData();
      },
      error: (err) => {
        console.error('❌ Error completo:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error body:', err.error);
        console.error('❌ Message:', err.error?.message);
        console.error('❌ Trace:', err.error?.trace);
        
        let errorMsg = 'Error desconocido';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        alert('❌ Error al actualizar producto:\n\n' + errorMsg);
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
