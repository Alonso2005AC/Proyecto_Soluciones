import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class Cart implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  igv: number = 0;
  total: number = 0;
  procesandoPago = false;
  metodoPago: string = 'tarjeta'; // Método de pago seleccionado
  
  // QR Code y datos de Agora
  qrCodeUrl: string = '';
  transactionId: string = '';
  countdown: number = 300; // 5 minutos en segundos
  countdownInterval: any;
  
  // Modal y pasos de checkout
  showCheckoutModal = false;
  checkoutStep = 1;
  userEmail = '';
  
  // Datos del formulario de checkout
  checkoutData = {
    email: '',
    nombre: '',
    apellidos: '',
    documento: '',
    telefono: '',
    aceptaTerminos: false,
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  };

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
      
      // Generar QR y transactionId cuando hay items y se selecciona agora
      if (this.cartItems.length > 0) {
        this.generateQRCode();
      }
    });

    // Iniciar countdown
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  generateQRCode(): void {
    // Generar ID de transacción único
    this.transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Datos para el QR (en producción esto vendría del backend de Agora)
    const qrData = {
      merchant: 'TiendaMass',
      amount: this.total.toFixed(2),
      currency: 'PEN',
      transactionId: this.transactionId,
      description: 'Compra en TiendaMass'
    };
    
    // Generar QR usando API pública (QuickChart)
    const qrContent = encodeURIComponent(JSON.stringify(qrData));
    this.qrCodeUrl = `https://quickchart.io/qr?text=${qrContent}&size=250&margin=2`;
  }

  startCountdown(): void {
    this.countdown = 300; // Reiniciar a 5 minutos
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.countdown = 0;
        // Regenerar QR automáticamente
        this.generateQRCode();
        this.startCountdown();
      }
    }, 1000);
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

    console.log('=== INFORMACIÓN DEL USUARIO LOGUEADO ===');
    console.log('Usuario completo:', usuario);
    console.log('Usuario ID:', usuario.id);
    console.log('Usuario ROL:', usuario.rol);
    console.log('Usuario CORREO:', usuario.correo);
    console.log('¿Tiene id_cliente?:', usuario.id_cliente);
    console.log('¿Tiene idCliente?:', usuario.idCliente);
    
    console.log('\n=== DATOS DE LA VENTA ===');
    console.log('Método de pago seleccionado:', this.metodoPago);
    console.log('Total a pagar:', this.total);

    // Preparar datos según la estructura EXACTA esperada por el backend
    const ventaRequest: any = {
      id_cliente: usuario.id,
      metodo_pago: this.metodoPago.trim().toLowerCase(), // "agora" o "tarjeta"
      total: this.total,
      tipo_comprobante: "boleta", // o "factura" según prefieras
      datos_fiscales: null,
      detalles: this.cartItems.map(item => ({
        id_producto: item.product.id,
        cantidad: item.quantity,
        precio_unitario: item.product.price,
        subtotal: item.product.price * item.quantity
      }))
    };

    console.log('Request completo:', JSON.stringify(ventaRequest, null, 2));
    console.log('Verificación metodo_pago:', ventaRequest.metodo_pago);
    console.log('Verificación id_cliente:', ventaRequest.id_cliente);
    console.log('Verificación tipo_comprobante:', ventaRequest.tipo_comprobante);
    console.log('Número de items en detalles:', ventaRequest.detalles.length);

    // Enviar venta al backend
    this.http.post<any>('http://localhost:8080/api/ventas/registrar-venta', ventaRequest).subscribe({
      next: (response) => {
        console.log('✅ Venta creada exitosamente:', response);
        this.procesarVentaExitosa(response);
      },
      error: (err) => {
        console.error('❌ Error al procesar la venta');
        console.error('Status:', err.status);
        console.error('Error completo:', err);
        console.error('Error body:', err.error);
        console.error('Error message:', err.message);
        
        this.procesandoPago = false;
        
        let mensaje = 'Error al procesar la compra.';
        
        if (err.status === 0) {
          mensaje = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (err.status === 400) {
          // Error de validación
          if (err.error?.message) {
            mensaje = `Error de validación: ${err.error.message}`;
          } else if (err.error?.errors) {
            // Si hay errores de validación de campos
            const errores = Object.entries(err.error.errors).map(([campo, msg]) => `${campo}: ${msg}`).join(', ');
            mensaje = `Errores de validación: ${errores}`;
          } else {
            mensaje = 'Error al validar los datos. Verifica que todos los campos sean correctos.';
          }
          console.error('Detalles del error 400:', err.error);
        } else if (err.status === 404) {
          mensaje = 'El endpoint de ventas no existe. Verifica que el backend tenga la ruta /api/ventas/registrar-venta';
        } else if (err.status === 500) {
          mensaje = 'Error interno del servidor. Revisa los logs del backend.';
        } else if (err.error?.mensaje) {
          mensaje = err.error.mensaje;
        }
        
        this.showToast(mensaje, 'error');
        
        // Mostrar detalles en consola para debugging
        console.error('📋 Datos enviados:', ventaRequest);
        console.error('⚠️ Mensaje para el usuario:', mensaje);
      }
    });
  }

  procesarVentaExitosa(response: any) {
    console.log('✅ Response del backend:', response);
    console.log('Tipo de response:', typeof response);
    console.log('Keys de response:', Object.keys(response));
    console.log('Response completo stringificado:', JSON.stringify(response, null, 2));
    
    // El backend devuelve el id_factura en response.factura.id_factura
    const idFactura = response.factura?.id_factura 
                   || response.factura?.idFactura
                   || response.id_factura 
                   || response.idFactura 
                   || response.data?.factura?.id_factura
                   || response.data?.id_factura
                   || response.id
                   || response.ventaId
                   || response.id_venta;
    
    console.log('🔍 ID de factura encontrado:', idFactura);
    console.log('🔍 Tipo del ID:', typeof idFactura);
    
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
      console.warn('No hay usuario en localStorage');
      this.cartService.clearCart();
      this.procesandoPago = false;
      this.router.navigate(['/client']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    console.log('🔍 Buscando última factura del cliente:', usuario.id);
    
    // Obtener la última factura del cliente
    this.facturaService.obtenerUltimaFacturaCliente(usuario.id).subscribe({
      next: (response) => {
        console.log('✅ Última factura obtenida:', response);
        if (response && response.id_factura) {
          this.descargarFacturaPDF(response.id_factura);
          this.showToast(`Factura N° ${response.numero_factura} lista para descargar`, 'success');
        } else {
          console.warn('⚠️ No se encontró ID de factura en la respuesta');
          this.showToast('Compra realizada. Puedes ver la factura en tu historial.', 'info');
        }
        this.cartService.clearCart();
        this.procesandoPago = false;
        setTimeout(() => {
          this.router.navigate(['/client']);
        }, 1500);
      },
      error: (err) => {
        console.error('❌ Error al obtener última factura');
        console.error('Status:', err.status);
        console.error('Error:', err);
        
        // No mostrar error si es 404 (no hay facturas), es normal
        if (err.status === 404) {
          console.log('ℹ️ El cliente aún no tiene facturas registradas');
          this.showToast('Compra registrada. La factura estará disponible pronto en tu historial.', 'info');
        } else {
          console.error('⚠️ Error inesperado al buscar factura:', err.message);
          this.showToast('Compra realizada. Puedes ver tu factura en el historial de compras.', 'info');
        }
        
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
        
        let mensaje = 'La venta se realizó correctamente, pero hubo un error al generar el PDF.';
        
        if (err.status === 500) {
          mensaje = '✅ Compra exitosa. Error al generar el PDF. Revisa los logs del backend o intenta descargarlo desde el historial.';
          console.error('💡 Posibles causas del error 500:');
          console.error('1. JasperReports no está configurado correctamente');
          console.error('2. Falta la plantilla .jrxml del reporte');
          console.error('3. Error al consultar datos de la factura en la BD');
          console.error('4. Librería de generación de PDF no disponible');
        } else if (err.status === 404) {
          mensaje = 'La factura no fue encontrada. Por favor, verifica en el historial.';
        } else if (err.status === 0) {
          mensaje = 'Error de conexión. El servidor no está respondiendo.';
        }
        
        this.showToast(mensaje, err.status === 500 ? 'warning' : 'error');
      }
    });
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.showToast('Carrito vaciado', 'info');
  }

  // ============================================
  // MÉTODOS DEL MODAL DE CHECKOUT
  // ============================================

  openCheckoutModal(): void {
    if (this.cartItems.length === 0) {
      this.showToast('El carrito está vacío', 'error');
      return;
    }

    // Cargar datos del usuario
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      const usuario = JSON.parse(usuarioData);
      this.checkoutData.email = usuario.correo || '';
      this.checkoutData.nombre = usuario.nombre || '';
      this.checkoutData.apellidos = usuario.apellido || '';
      this.checkoutData.telefono = usuario.telefono || '';
      this.userEmail = usuario.correo || '';
    }

    this.checkoutStep = 1;
    this.showCheckoutModal = true;
    document.body.style.overflow = 'hidden'; // Bloquear scroll del body
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
    this.checkoutStep = 1;
    document.body.style.overflow = ''; // Restaurar scroll
  }

  closeCheckoutModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('checkout-modal')) {
      this.closeCheckoutModal();
    }
  }

  nextStep(): void {
    if (this.checkoutStep < 3) {
      this.checkoutStep++;
    }
  }

  previousStep(): void {
    if (this.checkoutStep > 1) {
      this.checkoutStep--;
    }
  }

  selectPaymentMethod(method: string): void {
    this.metodoPago = method;
    console.log('Método de pago seleccionado:', this.metodoPago);
  }

  processPayment(): void {
    // Validar que el formulario de tarjeta esté completo si se seleccionó tarjeta
    if (this.metodoPago === 'tarjeta') {
      if (!this.checkoutData.cardNumber || !this.checkoutData.cardExpiry || 
          !this.checkoutData.cardCvv || !this.checkoutData.cardName) {
        this.showToast('Por favor completa todos los datos de la tarjeta', 'error');
        return;
      }
    }

    // Cerrar modal y proceder con el checkout
    this.showCheckoutModal = false;
    document.body.style.overflow = '';
    
    // Llamar al método checkout original
    this.checkout();
  }

  // ============================================
  // FIN MÉTODOS DEL MODAL
  // ============================================

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
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
