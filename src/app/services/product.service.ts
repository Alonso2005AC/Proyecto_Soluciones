import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from './api.service';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  sales: number;
  id_categoria?: number; // Categoría del producto
  categoria?: string; // Nombre de la categoría
  imagen?: string; // URL de la imagen del producto
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private productsCache: Product[] | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minuto

  constructor(private apiService: ApiService) {}

  getProducts(): Observable<Product[]> {
    // Usar caché si existe y no ha expirado
    const now = Date.now();
    if (this.productsCache && (now - this.cacheTime) < this.CACHE_DURATION) {
      console.log('⚡ Usando productos desde caché');
      return of(this.productsCache);
    }

    console.log('🌐 Cargando productos desde API...');
    return this.apiService.getProductos().pipe(
      map(productos => {
        if (!productos || productos.length === 0) {
          console.warn('⚠️ Backend devolvió array vacío');
          return [];
        }

        const mappedProducts = productos.map(p => ({
          id: p.id || p.id_producto,
          name: p.nombre || p.name,
          price: p.precio || p.price,
          stock: p.stock,
          sales: p.ventas || p.sales || 0,
          id_categoria: p.id_categoria || p.idCategoria,
          categoria: p.categoria,
          imagen: p.imagen || p.image || null
        }));
        
        // Guardar en caché
        this.productsCache = mappedProducts;
        this.cacheTime = now;
        console.log(`✅ ${mappedProducts.length} productos cargados y guardados en caché`);
        
        return mappedProducts;
      })
    );
  }

  // Método para limpiar el caché manualmente
  clearCache(): void {
    this.productsCache = null;
    this.cacheTime = 0;
    console.log('🗑️ Caché limpiado');
  }

  getProduct(id: number): Observable<Product> {
    return this.apiService.getProducto(id).pipe(
      map(p => ({
        id: p.id,
        name: p.nombre || p.name,
        price: p.precio || p.price,
        stock: p.stock,
        sales: p.ventas || p.sales || 0
      }))
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    const productoDto = {
      nombre: product.name,
      precio: product.price,
      stock: product.stock
    };
    return this.apiService.createProducto(productoDto).pipe(
      map(p => ({
        id: p.id,
        name: p.nombre,
        price: p.precio,
        stock: p.stock,
        sales: p.ventas || 0
      }))
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    const productoDto = {
      nombre: product.name,
      precio: product.price,
      stock: product.stock
    };
    return this.apiService.updateProducto(id, productoDto).pipe(
      map(p => ({
        id: p.id,
        name: p.nombre,
        price: p.precio,
        stock: p.stock,
        sales: p.ventas || 0
      }))
    );
  }

  deleteProduct(id: number): Observable<any> {
    return this.apiService.deleteProducto(id);
  }

  // Helper analytics - ahora usando Observables
  topSelling(): Observable<Product | null> {
    return this.getProducts().pipe(
      map(products => {
        if (!products.length) return null;
        return products.reduce((a, b) => (a.sales >= b.sales ? a : b));
      })
    );
  }

  leastSelling(): Observable<Product | null> {
    return this.getProducts().pipe(
      map(products => {
        if (!products.length) return null;
        return products.reduce((a, b) => (a.sales <= b.sales ? a : b));
      })
    );
  }

  productsWithoutRotation(): Observable<Product[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.sales === 0))
    );
  }
}

