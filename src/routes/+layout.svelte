<script>
  import { appName, publicRoutes } from '$lib/shared/constants/app';
  import '$lib/ui/artemis-theme/artemis.css';

  /** @type {import('./$types').LayoutData} */
  export let data;
</script>

<div class="app-shell">
  <nav class="top-nav" aria-label="Điều hướng Artemis">
    <a class="brand-link" href="/">{appName}</a>
    <div class="nav-links">
      {#each publicRoutes as route}
        <a href={route.href} aria-current={data.currentPath === route.href ? 'page' : undefined}>{route.label}</a>
      {/each}
      {#if data.adminScopes.vutrudodac}
        <a href="/vutrudodac/admin" aria-current={data.currentPath === '/vutrudodac/admin' ? 'page' : undefined}>Admin radar</a>
      {/if}
      {#if data.adminScopes.phienchotrenmay}
        <a href="/phienchotrenmay/admin" aria-current={data.currentPath === '/phienchotrenmay/admin' ? 'page' : undefined}>Admin chợ</a>
      {/if}
    </div>
    <a class="account-chip" href="/account">{data.user ? data.user.displayName : 'Đăng nhập'}</a>
  </nav>

  <slot />

  <footer class="footer-attribution">
    Made by <a href="https://miti99.com" rel="noreferrer">miti99</a> (miti99.com) from
    <a href="https://iamminhnguyet.com" rel="noreferrer">artemis</a> (iamminhnguyet.com) idea, with &lt;3
  </footer>
</div>
