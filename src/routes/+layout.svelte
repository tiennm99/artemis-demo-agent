<script lang="ts">
  import { appName, footerAttribution, publicRoutes } from '$lib/shared/constants/app';
  import '$lib/ui/artemis-theme/artemis.css';

  export let data: { currentPath: string };
</script>

<div class="app-shell">
  <nav class="top-nav" aria-label="Điều hướng Artemis">
    <a class="brand-link" href="/">{appName}</a>
    <div class="nav-links">
      {#each publicRoutes as route}
        <a href={route.href} aria-current={data.currentPath === route.href ? 'page' : undefined}>{route.label}</a>
      {/each}
    </div>
  </nav>

  <slot />

  <footer class="footer-attribution">{footerAttribution}</footer>
</div>
