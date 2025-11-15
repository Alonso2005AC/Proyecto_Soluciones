import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { FooterComponent } from '../components/footer/footer.component';

interface Venta {
  id: number;
  fecha_venta: string;
  total: number;
  estado: string;
  metodo_pago: string;
  observacion: string;
}

interface FacturaInfo {
  id: number;
  id_venta: number;
  tipo_comprobante: string;
  total: number;
  estado: string;
  fecha_emision: string;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, NavBarComponent, FooterComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css'
})
export class HistorialComponent implements OnInit {
  ventas: Venta[] = [];
  facturas: Map<number, FacturaInfo> = new Map();
  cargando = true;
  error = '';
  usuarioId: number = 0;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener usuario del localStorage
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      this.showToast('Debe iniciar sesión para ver el historial', 'error');
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    this.usuarioId = usuario.id;
    
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;
    // Usar endpoint correcto: /api/ventas/cliente/{idCliente}
    this.http.get<any[]>(`http://localhost:8080/api/ventas/cliente/${this.usuarioId}`)
      .subscribe({
        next: (ventas) => {
          console.log('Ventas recibidas:', ventas);
          this.ventas = ventas.sort((a, b) => 
            new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime()
          );
          
          // Cargar información de facturas para cada venta usando endpoint disponible
          this.ventas.forEach(venta => {
            this.cargarFactura(venta.id);
          });
          
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar historial:', err);
          this.error = 'No se pudo cargar el historial de compras. ' + (err.error?.mensaje || err.message);
          this.cargando = false;
        }
      });
  }

  cargarFactura(ventaId: number): void {
    // Usar endpoint disponible: /api/ventas/factura/{idVenta}
    this.http.get<FacturaInfo>(`http://localhost:8080/api/ventas/factura/${ventaId}`)
      .subscribe({
        next: (factura) => {
          console.log(`Factura para venta ${ventaId}:`, factura);
          this.facturas.set(ventaId, factura);
        },
        error: (err) => {
          console.warn(`No hay factura para venta ${ventaId}:`, err.status);
          // No mostrar error si simplemente no existe factura
        }
      });
  }

  descargarFactura(ventaId: number): void {
    const factura = this.facturas.get(ventaId);
    if (!factura) {
      this.showToast('Factura no disponible', 'error');
      return;
    }

    console.log('=== DESCARGANDO FACTURA ===');
    console.log('ID Factura:', factura.id);
    console.log('URL:', `http://localhost:8080/api/facturas/${factura.id}/pdf`);

    this.http.get(`http://localhost:8080/api/facturas/${factura.id}/pdf`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        console.log('✅ Blob recibido:', blob);
        console.log('Tamaño:', blob.size, 'bytes');
        console.log('Tipo:', blob.type);
        
        if (blob.size === 0) {
          console.error('❌ El blob está vacío');
          this.showToast('Error: El PDF está vacío', 'error');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura-${factura.id}.pdf`;
        document.body.appendChild(link); // Añadir al DOM
        link.click();
        document.body.removeChild(link); // Remover del DOM
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Factura descargada exitosamente');
        this.showToast('Factura descargada correctamente', 'success');
      },
      error: (err) => {
        console.error('❌ Error al descargar factura:', err);
        console.error('Status:', err.status);
        console.error('Error completo:', err);
        
        let mensaje = 'Error al descargar la factura';
        if (err.status === 404) {
          mensaje = 'La factura no fue encontrada en el servidor';
        } else if (err.status === 0) {
          mensaje = 'Error de conexión. El servidor no está respondiendo';
        }
        
        this.showToast(mensaje, 'error');
      }
    });
  }

  verDetalles(ventaId: number): void {
    this.router.navigate(['/detalle-venta', ventaId]);
  }

  volver(): void {
    this.router.navigate(['/client']);
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'completada':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'cancelada':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getMetodoPagoIcon(metodo: string): string {
    switch (metodo.toLowerCase()) {
      case 'tarjeta':
        return '💳';
      case 'agora':
        return '💵';
      case 'efectivo':
        return '💰';
      case 'yape':
        return '📱';
      default:
        return '💳';
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}
