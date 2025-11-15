import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../services/cart.service';
import { FacturaService, VentaRequest } from '../services/factura.service';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { FooterComponent } from '../components/footer/footer.component';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, NavBarComponent, FooterComponent, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  igv: number = 0;
  total: number = 0;
  procesandoPago = false;
  metodoPago: string = 'tarjeta'; // Método de pago seleccionado

  constructor(
    private cartService: CartService,
    private facturaService: FacturaService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Asegurar que el método de pago tiene un valor inicial
    if (!this.metodoPago) {
      this.metodoPago = 'tarjeta';
    }
    console.log('Método de pago inicial:', this.metodoPago);
    
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    this.igv = this.subtotal * 0.18; // 18% IGV (Impuesto General a las Ventas)
    this.total = this.subtotal + this.igv;
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity > 0) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  increaseQuantity(productId: number): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQuantity(productId: number): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    }
  }

  removeItem(productId: number): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item) {
      this.cartService.removeFromCart(productId);
      this.showToast(`${item.product.name} eliminado del carrito`, 'info');
    }
  }

  continueShopping(): void {
    this.router.navigate(['/client']);
  }

  checkout(): void {
    if (this.cartItems.length === 0) {
      this.showToast('El carrito está vacío', 'error');
      return;
    }

    // Validar método de pago con logs detallados
    console.log('=== VALIDACIÓN INICIAL ===');
    console.log('metodoPago antes de validar:', this.metodoPago);
    console.log('metodoPago es undefined?', this.metodoPago === undefined);
    console.log('metodoPago es null?', this.metodoPago === null);
    console.log('metodoPago está vacío?', this.metodoPago === '');
    
    if (!this.metodoPago || this.metodoPago.trim() === '') {
      this.showToast('Por favor selecciona un método de pago', 'error');
      console.error('Método de pago no válido:', this.metodoPago);
      return;
    }

    // Obtener datos del usuario
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      this.showToast('Debe iniciar sesión para realizar la compra', 'error');
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    this.procesandoPago = true;

    console.log('=== DATOS DE LA VENTA ===');
    console.log('Método de pago seleccionado:', this.metodoPago);
    console.log('Usuario ID:', usuario.id);
    console.log('Total a pagar:', this.total);

    // Preparar datos de la venta - Formato compatible con backend Java
    const ventaRequest: any = {
      venta: {
        id_cliente: usuario.id,
        total: this.total,
        metodo_pago: this.metodoPago.trim(),
        estado: 'completada',
        observacion: 'Compra desde web'
      },
      detalles: this.cartItems.map(item => ({
        id_producto: item.product.id,
        cantidad: item.quantity,
        precio_unitario: item.product.price,
        subtotal: item.product.price * item.quantity,
        lote: item.product.lote || 'L-MAS-001',
        fecha_vencimiento: item.product.fecha_vencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }))
    };

    console.log('Request completo:', JSON.stringify(ventaRequest, null, 2));
    console.log('Verificación metodo_pago:', ventaRequest.venta.metodo_pago);
    console.log('Tipo de metodo_pago:', typeof ventaRequest.venta.metodo_pago);
    console.log('Número de items en detalles:', ventaRequest.detalles.length);

    // Enviar venta al backend
    this.http.post<any>('http://localhost:8080/api/ventas/registrar-venta', ventaRequest).subscribe({
      next: (response) => {
        console.log('✅ Venta creada:', response);
        this.procesarVentaExitosa(response);
      },
      error: (err) => {
        console.error('Error al procesar la venta:', err);
        console.error('Status:', err.status);
        console.error('Error completo:', err);
        console.error('Mensaje:', err.error);
        
        // Si es error 400 pero la venta se creó (el backend responde con la data)
        if (err.status === 400 && err.error && typeof err.error === 'object' && !err.error.success) {
          // Intentar descargar el PDF con el último ID de factura
          this.descargarUltimaFactura();
        } else {
          this.procesandoPago = false;
          
          let mensaje = 'Error al procesar la compra.';
          if (err.status === 0) {
            mensaje = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
          } else if (err.error?.mensaje) {
            mensaje = err.error.mensaje;
          } else if (err.error) {
            mensaje = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
          }
          
          this.showToast(mensaje, 'error');
        }
      }
    });
  }

  procesarVentaExitosa(response: any) {
    console.log('Response del backend:', response);
    console.log('Tipo de response:', typeof response);
    console.log('Keys de response:', Object.keys(response));
    
    // Intentar obtener el ID de factura de diferentes formas
    const idFactura = response.id_factura || response.idFactura || response.factura?.id || response.factura?.id_factura;
    console.log('ID de factura encontrado:', idFactura);
    
    this.showToast('¡Compra realizada con éxito! Total: S/ ' + this.total.toFixed(2), 'success');
    
    // Si tenemos el ID de factura, descargar inmediatamente
    if (idFactura) {
      console.log('Intentando descargar factura con ID:', idFactura);
      setTimeout(() => {
        this.descargarFacturaPDF(idFactura);
      }, 500);
    } else {
      console.warn('No se pudo obtener el ID de factura de la respuesta');
      // Intentar obtener la última factura del usuario
      setTimeout(() => {
        this.descargarUltimaFactura();
      }, 500);
    }
    
    // Limpiar carrito
    this.cartService.clearCart();
    this.procesandoPago = false;
    
    // Redirigir al cliente
    setTimeout(() => {
      this.router.navigate(['/client']);
      
      // Preguntar si quiere ver historial después de redirigir
      setTimeout(() => {
        if (confirm('¿Deseas ver tu historial de compras?')) {
          this.router.navigate(['/historial']);
        }
      }, 1000);
    }, 2000);
  }

  descargarUltimaFactura() {
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      alert('✅ ¡Compra realizada con éxito!\n\nLa venta se registró correctamente en el sistema.');
      this.cartService.clearCart();
      this.procesandoPago = false;
      this.router.navigate(['/client']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    
    // Obtener la última factura del cliente
    this.facturaService.obtenerUltimaFacturaCliente(usuario.id).subscribe({
      next: (response) => {
        console.log('✅ Última factura obtenida:', response);
        if (response.id_factura) {
          this.descargarFacturaPDF(response.id_factura);
          alert(`✅ ¡Compra realizada con éxito!\n\nTotal: S/ ${this.total.toFixed(2)}\nFactura N° ${response.numero_factura}\n\nDescargando factura...`);
        }
        this.cartService.clearCart();
        this.procesandoPago = false;
        setTimeout(() => {
          this.router.navigate(['/client']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al obtener última factura:', err);
        // Aunque falle obtener la factura, la venta se registró correctamente
        alert(`✅ ¡Compra realizada con éxito!\n\nTotal: S/ ${this.total.toFixed(2)}\n\nLa venta se registró correctamente.\nPuedes descargar tu factura desde el historial de compras.`);
        this.cartService.clearCart();
        this.procesandoPago = false;
        setTimeout(() => {
          this.router.navigate(['/client']);
        }, 1500);
      }
    });
  }

  descargarFacturaPDF(idFactura: number): void {
    console.log('=== INICIANDO DESCARGA DE PDF ===');
    console.log('ID Factura:', idFactura);
    console.log('URL:', `http://localhost:8080/api/facturas/${idFactura}/pdf`);
    
    this.facturaService.descargarFacturaPDF(idFactura).subscribe({
      next: (blob) => {
        console.log('✅ Blob recibido:', blob);
        console.log('Tamaño del blob:', blob.size, 'bytes');
        console.log('Tipo del blob:', blob.type);
        
        if (blob.size === 0) {
          console.error('❌ El blob está vacío');
          this.showToast('Error: El PDF está vacío', 'error');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura_${idFactura}_${Date.now()}.pdf`;
        document.body.appendChild(link); // Añadir al DOM
        link.click();
        document.body.removeChild(link); // Remover del DOM
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Factura descargada exitosamente');
        this.showToast('Factura descargada correctamente', 'success');
      },
      error: (err) => {
        console.error('❌ Error al descargar la factura:', err);
        console.error('Status:', err.status);
        console.error('Error completo:', err);
        
        let mensaje = 'La venta se realizó correctamente, pero hubo un error al descargar la factura.';
        if (err.status === 404) {
          mensaje = 'La factura no fue encontrada. Por favor, verifica en el historial.';
        } else if (err.status === 0) {
          mensaje = 'Error de conexión. El servidor no está respondiendo.';
        }
        
        this.showToast(mensaje, 'error');
      }
    });
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.showToast('Carrito vaciado', 'info');
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
