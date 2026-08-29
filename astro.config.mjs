// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
// ...existing code...
export default defineConfig({
  vite: {
    logLevel: 'error',
  },
  site: 'https://koi141.github.io',
  base: '/dbsec-tutorials',
  integrations: [
    starlight({
      title: 'OraDBSec',
          head: [
        {
          tag: 'script',
          attrs: {
            src: 'https://www.googletagmanager.com/gtag/js?id=G-XY4JW48D03',
            async: true
          }
        },
        {
          tag: 'script',
          content: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XY4JW48D03');
  `
        },
        {
          tag: 'script',
          content: `
  (function () {
    function overlay() {
      var o = document.getElementById('img-zoom');
      if (o) return o;
      o = document.createElement('div');
      o.id = 'img-zoom';
      o.setAttribute('role', 'dialog');
      o.setAttribute('aria-label', '拡大画像');
      o.innerHTML = '<img alt="">';
      o.addEventListener('click', hide);
      document.body.appendChild(o);
      return o;
    }
    function show(src, alt) {
      var o = overlay();
      var im = o.firstChild;
      im.src = src;
      im.alt = alt || '';
      o.classList.add('open');
      document.documentElement.classList.add('img-zoom-lock');
    }
    function hide() {
      var o = document.getElementById('img-zoom');
      if (o) o.classList.remove('open');
      document.documentElement.classList.remove('img-zoom-lock');
    }
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'IMG') return;
      if (!t.closest('.sl-markdown-content')) return;
      if (t.closest('a')) return;
      show(t.currentSrc || t.src, t.alt);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hide();
    });
  })();
  `
        },
        {
          tag: 'script',
          content: `
  (function () {
    var KEY = 'sidebar-collapsed';
    try {
      if (localStorage.getItem(KEY) === '1') {
        document.documentElement.classList.add('sidebar-collapsed');
      }
    } catch (e) {}

    function isCollapsed() {
      return document.documentElement.classList.contains('sidebar-collapsed');
    }
    function apply(on) {
      document.documentElement.classList.toggle('sidebar-collapsed', on);
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      var b = document.getElementById('sidebar-toggle');
      if (b) b.setAttribute('aria-expanded', String(!on));
    }
    function insertButton() {
      if (document.getElementById('sidebar-toggle')) return;
      var wrap = document.querySelector('.header .title-wrapper');
      if (!wrap) return;
      var b = document.createElement('button');
      b.id = 'sidebar-toggle';
      b.type = 'button';
      b.setAttribute('aria-label', 'サイドバーの表示切り替え');
      b.setAttribute('aria-expanded', String(!isCollapsed()));
      b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="9" y1="4" x2="9" y2="20"></line></svg>';
      b.addEventListener('click', function () { apply(!isCollapsed()); });
      wrap.insertBefore(b, wrap.firstChild);
    }
    document.addEventListener('astro:page-load', insertButton);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', insertButton);
    } else {
      insertButton();
    }
  })();
  `
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
      favicon: './src/assets/favicon/favicon.png',
      sidebar: [
        {
          label: 'セットアップ',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: '認証',
          items: [
            { label: 'OCI IAM DBパスワード', autogenerate: { directory: 'authentication/oci-iam-dbcredential' } },
            { label: 'OCI IAM DBトークン', autogenerate: { directory: 'authentication/oci-iam-dbtoken' } },
            { label: 'MS Entra ID 認証', autogenerate: { directory: 'authentication/entraid-dbtoken' } },
            { label: 'ローカルユーザーMFA', autogenerate: { directory: 'authentication/password-mfa' } },
          ],
        },
        {
          label: 'アクセス制御',
          items: [
            { label: 'Deep Data Security', autogenerate: { directory: 'access-control/deep-data-security' } },
            { label: 'Database Vault', autogenerate: { directory: 'access-control/database-vault' } },
            { label: 'Oracle Label Security', autogenerate: { directory: 'access-control/oracle-label-security' } },
            
            { label: 'SQL Firewall', autogenerate: { directory: 'access-control/sql-firewall' } },
            { label: 'Virtual Private Database', autogenerate: { directory: 'access-control/virtual-private-database' } },
          ],
        },
        {
          label: '暗号化・マスキング',
          items: [
            { label: 'TDE', autogenerate: { directory: 'encryption/tde' } },
            { label: 'SQLNet暗号化', autogenerate: { directory: 'encryption/network' } },
            { label: 'Data Redaction', autogenerate: { directory: 'masking/data-redaction' } },
          ],
        },
        {
          label: '参考リンク',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
