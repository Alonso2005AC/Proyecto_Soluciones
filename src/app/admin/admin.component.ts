import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product } from '../services/product.service';
import { ApiService } from '../services/api.service';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
      updateProductImage(product: Product): void {
        const nuevaImagen = prompt('URL de la nueva imagen para ' + product.name, product.imagen || '');
        if (nuevaImagen && nuevaImagen !== product.imagen) {
          const updateData = {
            ...product,
            imagen: nuevaImagen
          };
          this.apiService.updateProducto(product.id, updateData).subscribe({
            next: (response) => {
              alert('✅ Imagen actualizada');
              this.loadData();
            },
            error: (err) => {
              console.error('❌ Error al actualizar imagen:', err);
              alert('❌ Error al actualizar imagen');
            }
          });
        }
      }
    inventarioChartOption: EChartsOption = {};
  products: Product[] = [];
  categories: any[] = [];
  loading: boolean = true;
  activeTab: string = 'productos'; // productos, categorias, ventas, estadisticas
  
  // Analytics antiguos
  top: Product | null = null;
  least: Product | null = null;
  withoutRotation: Product[] = [];
  
  // Dashboard data
  resumenGeneral: any = null;
  ventasResumenAnio: any[] = [];
  ventasTotalAnio: any[] = [];
  comprasResumenAnio: any[] = [];
  categoriaMasVendida: any[] = [];
  formaPagoMasUsada: any[] = [];

  // Inventario Serial Ideal
  inventarioSerialIdeal: any = null;
  inventarioMensajes: string[] = [];
  
  // Filtros de dashboard
  anioSeleccionado: number = new Date().getFullYear();
  mesSeleccionado: number = new Date().getMonth() + 1;
  ventasDelMes: any[] = [];
  ventasTotalMes: any[] = [];
  categoriaSeleccionada: number = 0;
  productosPorCategoria: any[] = [];
  
  loadingDashboard: boolean = false;
  
  // ECharts options
  ventasAnioChartOption: EChartsOption = {};
  ventasTotalAnioChartOption: EChartsOption = {};
  ventasMesChartOption: EChartsOption = {};
  ventasTotalMesChartOption: EChartsOption = {};
  categoriasChartOption: EChartsOption = {};
  productosChartOption: EChartsOption = {};
  pagosChartOption: EChartsOption = {};
  
  // Nuevo producto
  newProduct: any = {
    nombre: '',
    precio: 0,
    stock: 0,
    id_categoria: 0,
    codigo_barras: '',
    descripcion: '',
    imagen: '',
    lote: '',
    fecha_registro: '',
    fecha_vencimiento: ''
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
    this.loadDashboardData();
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
    if (tab === 'estadisticas') {
      this.loadDashboardData();
    }
  }

  loadDashboardData(): void {
    // Unificar llamada y procesamiento de inventario
    this.apiService.getInventarioSerialIdeal().subscribe({
      next: (data) => {
        this.inventarioSerialIdeal = data;
        // Mensajes
        this.inventarioMensajes = [];
        if (data.stock_bajo?.length) {
          const stockBajo = data.stock_bajo.map((p: { nombre: string; stock: number }) => `${p.nombre} (stock: ${p.stock})`).join(', ');
          this.inventarioMensajes.push(`Productos con stock bajo: ${stockBajo}`);
        }
        if (data.agotados?.length) {
          const agotados = data.agotados.map((p: { nombre: string }) => p.nombre).join(', ');
          this.inventarioMensajes.push(`Productos agotados: ${agotados}`);
        }
        if (typeof data.valor_total_inventario === 'number') {
          this.inventarioMensajes.push(`Valor total del inventario: S/ ${data.valor_total_inventario.toFixed(2)}`);
        }
        if (data.alertas_vencimiento?.length) {
          const vencimiento = data.alertas_vencimiento.map((p: { nombre: string; fecha_vencimiento: string }) => `${p.nombre} (vence: ${p.fecha_vencimiento})`).join(', ');
          this.inventarioMensajes.push(`Productos próximos a vencer: ${vencimiento}`);
        }
        if (typeof data.total_productos === 'number') {
          this.inventarioMensajes.push(`Total de productos activos: ${data.total_productos}`);
        }
        if (data.stock_por_categoria) {
          const categoriasMsg = Object.entries(data.stock_por_categoria).map(([cat, stock]) => `${cat}: ${stock}`).join(', ');
          this.inventarioMensajes.push(`Stock por categoría: ${categoriasMsg}`);
        }
        // Gráfico
        let categorias: string[] = [];
        let stocks: number[] = [];
        if (data.stock_por_categoria && typeof data.stock_por_categoria === 'object') {
          categorias = Object.keys(data.stock_por_categoria);
          stocks = Object.values(data.stock_por_categoria).map(v => Number(v));
        }
        if (!categorias.length) {
          categorias = ['Sin datos'];
          stocks = [0];
        }
        this.inventarioChartOption = {
          title: { text: 'Stock por Categoría', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: categorias, axisLabel: { rotate: 30 } },
          yAxis: { type: 'value' },
          series: [{ data: stocks, type: 'bar', itemStyle: { color: '#B8883B' }, label: { show: true, position: 'top' } }]
        };
        console.log('Inventario Chart Option:', this.inventarioChartOption);
      },
      error: (err) => {
        this.inventarioChartOption = {
          title: { text: 'Stock por Categoría', left: 'center' },
          xAxis: { type: 'category', data: ['Sin datos'] },
          yAxis: { type: 'value' },
          series: [{ data: [0], type: 'bar', itemStyle: { color: '#B8883B' } }]
        };
      }
    });
    this.loadingDashboard = true;
    
    // Cargar resumen general
    this.apiService.getDashboardResumenGeneral().subscribe({
      next: (data) => {
        this.resumenGeneral = data;
        console.log('✅ Resumen general:', data);
      },
      error: (err) => console.error('❌ Error resumen general:', err)
    });

    
    // Cargar ventas por año
    this.apiService.getDashboardVentasResumenAnio().subscribe({
      next: (data) => {
        this.ventasResumenAnio = data;
        console.log('✅ Ventas por año:', data);
        this.updateVentasAnioChart();
      },
      error: (err) => console.error('❌ Error ventas por año:', err)
    });
    
    // Cargar total de ventas por año
    this.apiService.getDashboardVentasTotalAnio().subscribe({
      next: (data) => {
        this.ventasTotalAnio = data;
        console.log('✅ Total ventas por año:', data);
        this.updateVentasTotalAnioChart();
      },
      error: (err) => console.error('❌ Error total ventas por año:', err)
    });
    
    // Cargar compras por año
    this.apiService.getDashboardComprasResumenAnio().subscribe({
      next: (data) => {
        this.comprasResumenAnio = data;
        console.log('✅ Compras por año:', data);
      },
      error: (err) => console.error('❌ Error compras por año:', err)
    });
    
    // Cargar categoría más vendida
    this.apiService.getDashboardCategoriaMasVendida().subscribe({
      next: (data) => {
        this.categoriaMasVendida = data;
        console.log('✅ Categoría más vendida:', data);
        this.updateCategoriasChart();
      },
      error: (err) => console.error('❌ Error categoría más vendida:', err)
    });
    
    // Cargar forma de pago más usada
    this.apiService.getDashboardFormaPagoMasUsada().subscribe({
      next: (data) => {
        this.formaPagoMasUsada = data;
        console.log('✅ Forma de pago más usada:', data);
        this.updatePagosChart();
        this.loadingDashboard = false;
      },
      error: (err) => {
        console.error('❌ Error forma de pago:', err);
        this.loadingDashboard = false;
      }
    });
    
    // Cargar ventas del mes actual
    this.loadVentasDelMes();
  }

  loadVentasDelMes(): void {
    this.apiService.getDashboardVentasResumenMes(this.anioSeleccionado).subscribe({
      next: (data) => {
        this.ventasDelMes = data;
        console.log('✅ Ventas del mes:', data);
        this.updateVentasMesChart();
      },
      error: (err) => console.error('❌ Error ventas del mes:', err)
    });
    
    this.apiService.getDashboardVentasTotalMes(this.anioSeleccionado).subscribe({
      next: (data) => {
        this.ventasTotalMes = data;
        console.log('✅ Total ventas del mes:', data);
        this.updateVentasTotalMesChart();
      },
      error: (err) => console.error('❌ Error total ventas del mes:', err)
    });
  }

  onAnioChange(): void {
    this.loadVentasDelMes();
  }

  onCategoriaChange(): void {
    if (this.categoriaSeleccionada > 0) {
      this.apiService.getDashboardProductoMasVendidoCategoria(this.categoriaSeleccionada).subscribe({
        next: (data) => {
          this.productosPorCategoria = data;
          console.log('✅ Productos por categoría:', data);
          this.updateProductosChart();
        },
        error: (err) => console.error('❌ Error productos por categoría:', err)
      });
    } else {
      this.productosPorCategoria = [];
      this.productosChartOption = {};
    }
  }

  getMesNombre(mes: number): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[mes - 1] || mes.toString();
  }

  getMaxValue(data: any[]): number {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(item => item.valor));
  }

  getPercentage(item: any, data: any[]): number {
    const total = data.reduce((sum, d) => sum + d.valor, 0);
    return total > 0 ? Math.round((item.valor / total) * 100) : 0;
  }

  getPieColor(index: number): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];
    return colors[index % colors.length];
  }

  getPieDashArray(item: any, data: any[]): string {
    const percentage = this.getPercentage(item, data);
    const circumference = 2 * Math.PI * 80;
    const dashLength = (percentage / 100) * circumference;
    return `${dashLength} ${circumference}`;
  }

  getPieOffset(index: number, data: any[]): number {
    const circumference = 2 * Math.PI * 80;
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const percentage = this.getPercentage(data[i], data);
      offset += (percentage / 100) * circumference;
    }
    return -offset;
  }

  getGradientColor(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    return gradients[index % gradients.length];
  }

  // ============================================
  // MÉTODOS PARA ACTUALIZAR GRÁFICOS ECHARTS
  // ============================================

  updateVentasAnioChart(): void {
    this.ventasAnioChartOption = {
      title: { text: 'Ventas por Año', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: this.ventasResumenAnio.map(item => item.nombre)
      },
      yAxis: { type: 'value' },
      series: [{
        data: this.ventasResumenAnio.map(item => item.valor),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#60a5fa' }
            ]
          }
        },
        label: { show: true, position: 'top' }
      }]
    };
  }

  updateVentasTotalAnioChart(): void {
    this.ventasTotalAnioChartOption = {
      title: { text: 'Ingresos por Año', left: 'center' },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>S/ ${data.value.toFixed(2)}`;
        }
      },
      xAxis: {
        type: 'category',
        data: this.ventasTotalAnio.map(item => item.nombre)
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: 'S/ {value}' }
      },
      series: [{
        data: this.ventasTotalAnio.map(item => item.valor),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.5)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
            ]
          }
        },
        lineStyle: { color: '#10b981', width: 3 },
        itemStyle: { color: '#10b981' },
        label: { show: true, position: 'top', formatter: (params: any) => `S/ ${params.value.toFixed(2)}` }
      }]
    };
  }

  updateVentasMesChart(): void {
    this.ventasMesChartOption = {
      title: { text: `Ventas Mensuales ${this.anioSeleccionado}`, left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: this.ventasDelMes.map(item => this.getMesNombre(+item.nombre))
      },
      yAxis: { type: 'value' },
      series: [{
        data: this.ventasDelMes.map(item => item.valor),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#a78bfa' }
            ]
          }
        },
        label: { show: true, position: 'top' }
      }]
    };
  }

  updateVentasTotalMesChart(): void {
    this.ventasTotalMesChartOption = {
      title: { text: `Ingresos Mensuales ${this.anioSeleccionado}`, left: 'center' },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>S/ ${data.value.toFixed(2)}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: 'S/ {value}' }
      },
      yAxis: {
        type: 'category',
        data: this.ventasTotalMes.map(item => this.getMesNombre(+item.nombre)).reverse()
      },
      series: [{
        data: this.ventasTotalMes.map(item => item.valor).reverse(),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#34d399' }
            ]
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => `S/ ${params.value.toFixed(2)}`
        }
      }]
    };
  }

  updateCategoriasChart(): void {
    const total = this.categoriaMasVendida.reduce((sum, item) => sum + item.valor, 0);
    this.categoriasChartOption = {
      title: { text: 'Categorías Más Vendidas', left: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percentage = ((params.value / total) * 100).toFixed(1);
          return `${params.name}<br/>${params.value} ventas (${percentage}%)`;
        }
      },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: (params: any) => {
            const percentage = ((params.value / total) * 100).toFixed(1);
            return `${params.name}\n${percentage}%`;
          }
        },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data: this.categoriaMasVendida.map(item => ({
          name: item.nombre,
          value: item.valor
        }))
      }]
    };
  }

  updateProductosChart(): void {
    if (this.productosPorCategoria.length === 0) return;
    
    this.productosChartOption = {
      title: { text: 'Top Productos', left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}' }
      },
      yAxis: {
        type: 'category',
        data: this.productosPorCategoria.map(item => item.nombre).reverse(),
        axisLabel: { interval: 0, rotate: 0 }
      },
      series: [{
        data: this.productosPorCategoria.map((item, index) => ({
          value: item.valor,
          itemStyle: {
            color: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#f59e0b' : '#3b82f6'
          }
        })).reverse(),
        type: 'bar',
        label: { show: true, position: 'right' }
      }]
    };
  }

  updatePagosChart(): void {
    const total = this.formaPagoMasUsada.reduce((sum, item) => sum + item.valor, 0);
    this.pagosChartOption = {
      title: { text: 'Métodos de Pago', left: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percentage = ((params.value / total) * 100).toFixed(1);
          return `${params.name}<br/>${params.value} transacciones (${percentage}%)`;
        }
      },
      series: [{
        type: 'pie',
        radius: '70%',
        center: ['50%', '50%'],
        data: this.formaPagoMasUsada.map(item => ({
          name: item.nombre.charAt(0).toUpperCase() + item.nombre.slice(1),
          value: item.valor
        })),
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: (params: any) => {
            const percentage = ((params.value / total) * 100).toFixed(1);
            return `{b}\n${percentage}%`;
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }

  openAddModal(): void {
    this.showAddModal = true;
    const hoy = new Date().toISOString().split('T')[0];
    const unAnoDespues = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    this.newProduct = {
      nombre: '',
      precio: 0,
      stock: 0,
      id_categoria: 0,
      codigo_barras: '',
      descripcion: '',
      imagen: '',
      lote: 'L-MAS-001',
      fecha_registro: hoy,
      fecha_vencimiento: unAnoDespues
    };
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addProduct(): void {
    if (!this.newProduct.nombre || this.newProduct.precio <= 0) {
      alert('Por favor completa los campos requeridos: nombre y precio');
      return;
    }

    if (!this.newProduct.id_categoria || this.newProduct.id_categoria === 0) {
      alert('Por favor selecciona una categoría');
      return;
    }

    // Asegurar que los campos tengan valores por defecto si están vacíos
    const productoData = {
      ...this.newProduct,
      lote: this.newProduct.lote || 'L-MAS-001',
      fecha_registro: this.newProduct.fecha_registro || new Date().toISOString().split('T')[0],
      fecha_vencimiento: this.newProduct.fecha_vencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      imagen: this.newProduct.imagen || null
    };

    console.log('📦 Enviando producto:', productoData);

    this.apiService.createProducto(productoData).subscribe({
      next: (response) => {
        console.log('✅ Producto creado:', response);
        alert('✅ Producto agregado exitosamente');
        this.closeAddModal();
        this.loadData();
      },
      error: (err) => {
        console.error('❌ Error al crear producto:', err);
        console.error('Status:', err.status);
        console.error('Error body:', err.error);
        
        let errorMsg = 'Error al agregar producto';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error) {
          errorMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
        }
        
        alert('❌ ' + errorMsg);
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
