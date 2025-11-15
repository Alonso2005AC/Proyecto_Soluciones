import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Métodos de autenticación
  login(correo: string, contrasena: string): Observable<any> {
    console.log('Enviando petición a:', `${this.API_URL}/auth/login-cliente`);
    console.log('Con datos:', { correo, contrasena: '***' });
    return this.http.post(`${this.API_URL}/auth/login-cliente`, { correo, contrasena });
  }

  loginUsuario(correo: string, contrasena: string): Observable<any> {
    console.log('Enviando petición a:', `${this.API_URL}/auth/login-usuario`);
    console.log('Con datos:', { correo, contrasena: '***' });
    return this.http.post(`${this.API_URL}/auth/login-usuario`, { correo, contrasena });
  }

  register(usuario: any): Observable<any> {
    // Asegurar que el campo se llame 'contraseña' con ñ como espera el backend
    const cliente = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      contraseña: usuario.contrasena, // Mapear contrasena -> contraseña
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      rol: 'cliente'
    };
    console.log('Datos enviados al backend:', { ...cliente, contraseña: '***' });
    return this.http.post(`${this.API_URL}/auth/registrar`, cliente);
  }

  // Métodos de productos
  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/productos`, {
      headers: this.getAuthHeaders()
    });
  }

  getProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/productos/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createProducto(producto: any): Observable<any> {
    return this.http.post(`${this.API_URL}/productos`, producto, {
      headers: this.getAuthHeaders()
    });
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.API_URL}/productos/${id}`, producto, {
      headers: this.getAuthHeaders()
    });
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/productos/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Métodos de categorías
  getCategorias(): Observable<any[]> {
    // No necesita autenticación para ver categorías públicas
    return this.http.get<any[]>(`${this.API_URL}/categorias`);
  }

  // Métodos de ventas
  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/ventas`, {
      headers: this.getAuthHeaders()
    });
  }

  createVenta(venta: any): Observable<any> {
    return this.http.post(`${this.API_URL}/ventas`, venta, {
      headers: this.getAuthHeaders()
    });
  }

  // Métodos de usuarios (admin)
  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/usuarios`, {
      headers: this.getAuthHeaders()
    });
  }

  createUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios`, usuario, {
      headers: this.getAuthHeaders()
    });
  }

  updateUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/${id}`, usuario, {
      headers: this.getAuthHeaders()
    });
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Métodos de reportes
  getReporteVentas(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.API_URL}/reportes/ventas`;
    if (fechaInicio && fechaFin) {
      url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    });
  }

  getReporteInventario(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/reportes/inventario`, {
      headers: this.getAuthHeaders()
    });
  }

  // Helpers
  private getAuthHeaders(): HttpHeaders {
    const usuario = this.getUsuarioActual();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (usuario && usuario.token) {
      headers = headers.set('Authorization', `Bearer ${usuario.token}`);
    }
    
    return headers;
  }

  getUsuarioActual(): any {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  logout(): void {
    localStorage.removeItem('usuario');
  }

  isAuthenticated(): boolean {
    return !!this.getUsuarioActual();
  }

  getUserRole(): string | null {
    const usuario = this.getUsuarioActual();
    return usuario ? usuario.rol : null;
  }
}
