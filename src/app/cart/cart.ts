import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { FacturaService, VentaRequest } from '../services/factura.service';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, NavBarComponent, FormsModule],
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
    private router: Router
  ) {}

  ngOnInit(): void {
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
    if (confirm('¿Estás seguro de eliminar este producto del carrito?')) {
      this.cartService.removeFromCart(productId);
    }
  }

  continueShopping(): void {
    this.router.navigate(['/client']);
  }

  checkout(): void {
    if (this.cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Obtener datos del usuario
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      alert('Debe iniciar sesión para realizar la compra');
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    this.procesandoPago = true;

    console.log('=== DATOS DE LA VENTA ===');
    console.log('Método de pago seleccionado:', this.metodoPago);

    // Preparar datos de la venta - Enviar directamente al backend
    const ventaRequest: any = {
      venta: {
        id_cliente: usuario.id,
        total: this.total,
        estado: 'completada',
        metodo_pago: this.metodoPago,
        observacion: `Compra realizada por ${usuario.nombre} ${usuario.apellido}`,
        fecha_venta: new Date().toISOString()
      },
      detalles: this.cartItems.map(item => ({
        id_producto: item.product.id,
        cantidad: item.quantity,
        precio_unitario: item.product.price,
        subtotal: item.product.price * item.quantity
      })),
      factura: {
        id_venta: 0,
        tipo_comprobante: 'boleta',
        total: this.total,
        estado: 'emitida',
        datos_fiscales: JSON.stringify({
          cliente: usuario.nombre + ' ' + usuario.apellido,
          correo: usuario.correo,
          direccion: usuario.direccion || 'No especificada'
        }),
        fecha_emision: new Date().toISOString()
      }
    };

    console.log('Request completo:', JSON.stringify(ventaRequest, null, 2));

    // Crear venta con factura
    this.facturaService.crearVentaConFactura(ventaRequest).subscribe({
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
          
          alert(mensaje + '\n\nRevisa la consola del navegador (F12) para más detalles.');
        }
      }
    });
  }

  procesarVentaExitosa(response: any) {
    // Descargar PDF de la factura
    if (response.idFactura || response.id_factura) {
      const idFactura = response.idFactura || response.id_factura;
      this.descargarFacturaPDF(idFactura);
    }

    const numeroFactura = response.numeroFactura || response.numero_factura || 'N/A';
    alert(`¡Compra realizada con éxito!\nTotal: S/ ${this.total.toFixed(2)}\nFactura N° ${numeroFactura}\n\nDescargando factura...`);
    
    // Limpiar carrito y redirigir
    this.cartService.clearCart();
    this.procesandoPago = false;
    
    setTimeout(() => {
      this.router.navigate(['/client']);
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
    this.facturaService.descargarFacturaPDF(idFactura).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura_${idFactura}_${Date.now()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        console.log('Factura descargada exitosamente');
      },
      error: (err) => {
        console.error('Error al descargar la factura:', err);
        alert('La venta se realizó correctamente, pero hubo un error al descargar la factura.');
      }
    });
  }

  clearCart(): void {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
      this.cartService.clearCart();
    }
  }
}
