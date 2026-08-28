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
