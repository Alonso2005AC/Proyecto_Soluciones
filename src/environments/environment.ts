export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  endpoints: {
    // Ajusta estos endpoints según tu backend de Spring Boot
    login: '/api/usuarios/login',  // Cambia esto según tu backend
    register: '/api/usuarios/register',
    productos: '/api/productos',
    ventas: '/api/ventas',
    usuarios: '/api/usuarios',
    reportes: '/api/reportes'
  }
};
