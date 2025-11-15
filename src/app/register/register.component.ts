import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  nombre: string = '';
  apellido: string = '';
  correo: string = '';
  contrasena: string = '';
  telefono: string = '';
  direccion: string = '';
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  register() {
    this.error = '';
    this.success = '';
    this.loading = true;

    const cliente = {
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
      contrasena: this.contrasena,
      telefono: this.telefono,
      direccion: this.direccion
    };

    console.log('Registrando cliente:', { ...cliente, contrasena: '***' });

    this.apiService.register(cliente).subscribe({
      next: (res) => {
        console.log('✅ Registro exitoso:', res);
        this.success = 'Registro exitoso. Redirigiendo al login...';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Error en registro:', err);
        console.error('Status:', err.status);
        console.error('Error body:', err.error);
        this.loading = false;
        
        if (err.status === 400) {
          const mensajeBackend = typeof err.error === 'string' ? err.error : err.error?.message;
          this.error = mensajeBackend || 'Datos inválidos. Verifica todos los campos.';
        } else if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor';
        } else {
          this.error = err.error?.message || err.error || 'Error al registrar';
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
