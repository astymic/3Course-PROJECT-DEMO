import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'LiLu — Взуттєва фабрика',
  description: 'Офіційний інтернет-магазин LiLu. Каталог, кошик, оплата LiqPay, доставка Нова Пошта.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="antialiased">
        <CartProvider>
          {children}
          <ChatWidget />
        </CartProvider>

        {/* ─── Tawk.to live chat ──────────────────────────────────────
            Replace YOUR_TAWK_ID with your actual Tawk.to ID from:
            https://dashboard.tawk.to/#/account/property/widget
        ──────────────────────────────────────────────────────────── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var TAWK_ID = 'YOUR_TAWK_ID'; // ← замінити на реальний ID з Tawk.to

  // ── Cookie helpers ─────────────────────
  function getCookie(name) {
    var m = document.cookie.match('(^|;)\\\\s*' + name + '\\\\s*=\\\\s*([^;]+)');
    return m ? decodeURIComponent(m.pop()) : null;
  }
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/';
  }

  // Don't load if user already dismissed within 7 days
  if (getCookie('tawkto_opted_out') === '1') return;

  function loadTawk() {
    if (window.__tawkLoaded) return;
    window.__tawkLoaded = true;

    var Tawk_API = window.Tawk_API || {};
    var s1 = document.createElement('script');
    var s0 = document.getElementsByTagName('script')[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/' + TAWK_ID + '/default';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);

    // Minimize by default, open after 30 sec
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = function() {
      window.Tawk_API.hideWidget && window.Tawk_API.hideWidget();
      setTimeout(function() {
        if (!getCookie('tawkto_shown')) {
          window.Tawk_API.showWidget && window.Tawk_API.showWidget();
          window.Tawk_API.maximize && window.Tawk_API.maximize();
          setCookie('tawkto_shown', '1', 1); // Don't auto-open again for 1 day
        }
      }, 30000);

      // Track closes
      window.Tawk_API.onChatMinimized = function() {
        setCookie('tawkto_shown', '1', 1);
      };
    };
  }

  // ── Trigger 1: 30 seconds after page load ──────────────
  var timer30 = setTimeout(loadTawk, 30000);

  // ── Trigger 2: Exit intent (mouse leaves viewport top) ──
  window.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('mouseleave', function(e) {
      if (e.clientY <= 0 && !window.__tawkLoaded) {
        clearTimeout(timer30);
        loadTawk();
      }
    });
  });
})();
            `,
          }}
        />
      </body>
    </html>
  )
}
