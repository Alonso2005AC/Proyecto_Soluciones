import { Routes } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ClientComponent } from './client/client.component';
import { AdminComponent } from './admin/admin.component';
import { Cart } from './cart/cart';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'client', component: ClientComponent },
	{ path: 'cliente', component: ClientComponent },
	{ path: 'cart', component: Cart },
	{ path: 'carrito', component: Cart },
	{ path: 'admin', component: AdminComponent },
	{ path: '**', redirectTo: 'login' }
];
