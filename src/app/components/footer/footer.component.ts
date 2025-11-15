import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="footer-top">
        <div class="footer-payment-methods">
          <h3>MÉTODOS DE PAGO</h3>
          <div class="payment-icons">
            <div class="payment-card">
              <span class="payment-label">TARJETAS DE CRÉDITO</span>
              <i class="fa-brands fa-cc-visa"></i>
              <i class="fa-brands fa-cc-mastercard"></i>
            </div>
            <div class="payment-card">
              <span class="payment-label">TARJETAS DE DÉBITO</span>
              <i class="fa-brands fa-cc-visa"></i>
              <i class="fa-brands fa-cc-mastercard"></i>
              <i class="fa-brands fa-cc-amex"></i>
            </div>
            <div class="payment-card">
              <span class="payment-label">PAGO CONTRA ENTREGA</span>
              <div class="agora-payment">AGORA</div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-main">
        <div class="footer-container">
          <div class="footer-section">
            <h4>CONÓCEME</h4>
            <ul>
              <li><a href="#conoceme">Conóceme</a></li>
              <li><a href="#precios">Precios Mass</a></li>
              <li><a href="#ubicame">Ubícame</a></li>
              <li><a href="#productos">Productos</a></li>
              <li><a href="#trabaja">Trabaja Conmigo</a></li>
              <li><a href="#ofrecer">¿Cómo ofrecer mi local?</a></li>
              <li><a href="#alquila">Alquila tu local</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>SERVICIO AL CLIENTE</h4>
            <ul>
              <li><strong>Horario de atención:</strong></li>
              <li>De lunes a domingo de 7 AM a 10 PM</li>
              <li><a href="mailto:servicioalcliente@tiendasmass.pe">servicioalcliente@tiendasmass.pe</a></li>
              <li><a href="#cambios">Políticas de cambios y devoluciones</a></li>
              <li><a href="#privacidad">Política de Privacidad</a></li>
              <li><a href="#terminos">Términos y condiciones</a></li>
              <li><a href="#comprobante">Comprobante electrónico</a></li>
              <li>
                <a href="#reclamaciones" class="libro-reclamaciones">
                  <i class="fa-solid fa-book"></i>
                  Libro de Reclamaciones
                </a>
              </li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>SÍGUEME EN</h4>
            <div class="social-icons">
              <a href="https://facebook.com" target="_blank" class="social-icon facebook">
                <i class="fa-brands fa-facebook-f"></i>
              </a>
              <a href="https://instagram.com" target="_blank" class="social-icon instagram">
                <i class="fa-brands fa-instagram"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" class="social-icon tiktok">
                <i class="fa-brands fa-tiktok"></i>
              </a>
              <a href="https://youtube.com" target="_blank" class="social-icon youtube">
                <i class="fa-brands fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© Tiendas Mass 2025</p>
        <p>Compañía Hard Discount S.A.C</p>
      </div>

      <!-- Botón flotante de WhatsApp -->
      <a href="https://wa.me/51999999999" target="_blank" class="whatsapp-float">
        <i class="fa-brands fa-whatsapp"></i>
      </a>
    </footer>
  `,
  styles: [`
    .footer {
      background: white;
      margin-top: 60px;
      position: relative;
    }

    .footer-top {
      background: #f9fafb;
      padding: 40px 20px;
      border-top: 3px solid #FFC107;
    }

    .footer-payment-methods {
      max-width: 1400px;
      margin: 0 auto;
    }

    .footer-payment-methods h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 24px;
      text-align: center;
      letter-spacing: 1px;
    }

    .payment-icons {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .payment-card {
      background: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      min-width: 180px;
      border: 2px solid #e5e7eb;
      transition: all 0.3s ease;
    }

    .payment-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      border-color: #FFC107;
    }

    .payment-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #1f2937;
      text-align: center;
      letter-spacing: 0.5px;
    }

    .payment-card i {
      font-size: 2.5rem;
      color: #1f2937;
      margin: 0 4px;
    }

    .payment-card .fa-cc-visa {
      color: #1434CB;
    }

    .payment-card .fa-cc-mastercard {
      color: #EB001B;
    }

    .payment-card .fa-cc-amex {
      color: #006FCF;
    }

    .payment-card .fa-money-bill-wave {
      color: #10b981;
    }

    .agora-payment {
      font-size: 1.8rem;
      font-weight: 900;
      color: #3b82f6;
      background: white;
      padding: 8px 20px;
      border-radius: 8px;
      border: 2px solid #3b82f6;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .footer-main {
      background: #1f2937;
      padding: 60px 20px 40px;
      color: white;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 60px;
    }

    .footer-section h4 {
      font-size: 1.1rem;
      font-weight: 800;
      color: #FFC107;
      margin-bottom: 20px;
      letter-spacing: 1px;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section ul li {
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .footer-section ul li a {
      color: #d1d5db;
      text-decoration: none;
      transition: all 0.3s ease;
      font-size: 0.95rem;
    }

    .footer-section ul li a:hover {
      color: #FFC107;
      padding-left: 8px;
    }

    .footer-section ul li strong {
      color: white;
      font-weight: 700;
    }

    .libro-reclamaciones {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: white;
      color: #1f2937 !important;
      border-radius: 8px;
      font-weight: 700;
      margin-top: 8px;
      transition: all 0.3s ease;
    }

    .libro-reclamaciones:hover {
      background: #FFC107;
      transform: scale(1.05);
      padding-left: 16px !important;
    }

    .libro-reclamaciones i {
      font-size: 1.2rem;
      color: #3b82f6;
    }

    .social-icons {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    .social-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .social-icon:hover {
      transform: translateY(-4px) scale(1.1);
    }

    .social-icon.facebook {
      background: #1877f2;
    }

    .social-icon.instagram {
      background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    }

    .social-icon.tiktok {
      background: #000000;
    }

    .social-icon.youtube {
      background: #ff0000;
    }

    .footer-bottom {
      background: #111827;
      padding: 24px 20px;
      text-align: center;
      color: #9ca3af;
      font-size: 0.9rem;
    }

    .footer-bottom p {
      margin: 4px 0;
    }

    .whatsapp-float {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: #25d366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
      z-index: 9999;
      transition: all 0.3s ease;
      text-decoration: none;
      animation: pulse-whatsapp 2s infinite;
    }

    .whatsapp-float:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 24px rgba(37, 211, 102, 0.6);
    }

    @keyframes pulse-whatsapp {
      0%, 100% {
        box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
      }
      50% {
        box-shadow: 0 4px 24px rgba(37, 211, 102, 0.7);
      }
    }

    @media (max-width: 1024px) {
      .footer-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 40px;
      }
    }

    @media (max-width: 640px) {
      .footer-container {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .payment-icons {
        flex-direction: column;
        align-items: center;
      }

      .payment-card {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class FooterComponent {}
