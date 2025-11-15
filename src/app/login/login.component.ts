import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  clientEmail: string = '';
  clientPassword: string = '';
  adminEmail: string = '';
  adminPassword: string = '';
  showAdminModal: boolean = false;
  error: string = '';
  loading: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  // Login de cliente
  loginClient() {
    this.error = '';
    this.loading = true;
    
    console.log('Intentando login con:');
    console.log('- Correo:', this.clientEmail);
    console.log('- Contraseña:', this.clientPassword ? '(proporcionada)' : '(vacía)');
    
    this.apiService.login(this.clientEmail, this.clientPassword).subscribe({
      next: (res) => {
        console.log('✅ Login exitoso:', res);
        localStorage.setItem('usuario', JSON.stringify(res));
        this.loading = false;
        
        // Redirigir según rol
        if (res.rol === 'administrador') {
          this.router.navigate(['/admin']);
        } else {
          // Cualquier otro rol va al catálogo de cliente
          this.router.navigate(['/client']);
        }
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        console.error('Status:', err.status);
        console.error('Error body:', err.error);
        this.loading = false;
        
        if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (err.status === 401) {
          // Mostrar el mensaje específico del backend si existe
          const mensajeBackend = typeof err.error === 'string' ? err.error : err.error?.message;
          this.error = mensajeBackend || 'Credenciales incorrectas. Verifica tu correo y contraseña.';
        } else if (err.status === 404) {
          this.error = 'Endpoint no encontrado. Verifica la URL del backend';
        } else {
          this.error = err.error?.message || err.error || err.message || 'Error en login';
        }
      }
    });
  }

  // Login de administrador
  loginAdmin() {
    this.error = '';
    this.loading = true;
    
    console.log('=== LOGIN ADMIN ===');
    console.log('Correo:', this.adminEmail);
    console.log('Contraseña length:', this.adminPassword?.length || 0);
    console.log('Contraseña:', this.adminPassword);
    
    this.apiService.login(this.adminEmail, this.adminPassword).subscribe({
      next: (res) => {
        console.log('Login admin exitoso:', res);
        
        // Verificar que sea administrador
        if (res.rol !== 'administrador') {
          this.error = 'Este usuario no tiene permisos de administrador';
          this.loading = false;
          return;
        }
        
        localStorage.setItem('usuario', JSON.stringify(res));
        this.loading = false;
        this.showAdminModal = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        console.error('Error en login admin:', err);
        console.error('Error completo:', JSON.stringify(err));
        this.loading = false;
        
        if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor';
        } else if (err.status === 401) {
          this.error = 'Contraseña incorrecta. Usa: password123';
        } else if (err.status === 404) {
          this.error = 'Usuario admin no encontrado. Verifica que admin@mass.com exista en la tabla usuario';
        } else if (err.status === 500) {
          this.error = 'Error en el servidor. Revisa la consola del backend o los logs de Spring Boot';
          console.error('💡 Posibles causas:');
          console.error('1. Campo "contrasena" vs "contraseña" en el modelo Usuario');
          console.error('2. Método getRol() devuelve null o tipo incorrecto');
          console.error('3. Falta el método getContrasena() en Usuario.java');
        } else {
          this.error = err.error?.message || err.error || 'Error al iniciar sesión';
        }
      }
    });
  }

  fillDemoCredentials(): void {
    this.clientEmail = 'juan.perez@example.com';
    this.clientPassword = 'password123';
  }

  fillDemoAdmin(): void {
    this.adminEmail = 'admin@mass.com';
    this.adminPassword = 'password123';
  }
}
