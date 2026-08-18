<script>
  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;
</script>

<svelte:head>
  <title>Account - Artemis</title>
</svelte:head>

<main class="route-surface narrow-surface">
  <section class="tool-panel account-panel">
    <p class="eyebrow">Cổng Artemis</p>
    <h1 class="panel-title">Account</h1>

    {#if data.reason === 'signin'}
      <p class="status-note warning">Bạn cần đăng nhập Google trước khi gửi tín hiệu.</p>
    {:else if data.reason === 'verified-email'}
      <p class="status-note warning">Artemis chỉ nhận email Google đã xác minh.</p>
    {/if}

    {#if data.user}
      <dl class="profile-list">
        <div>
          <dt>Tín hiệu</dt>
          <dd>{data.user.displayName}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{data.user.email}</dd>
        </div>
        <div>
          <dt>Auth</dt>
          <dd>{data.authMode === 'local-dev' ? 'local dev fallback' : 'Supabase Google OAuth'}</dd>
        </div>
      </dl>

      <form method="POST" action="?/signOut">
        <button class="pill-action secondary-action" type="submit">Đóng cổng</button>
      </form>
    {:else}
      <p>Đăng nhập bằng Google OAuth để Artemis xác nhận email và lưu tín hiệu theo tài khoản thật.</p>
      <form method="POST" action="?/signIn">
        <button class="pill-action" type="submit">Mở cổng Google</button>
      </form>
    {/if}

    {#if form?.message}
      <p class="status-note warning">{form.message}</p>
    {/if}
  </section>
</main>
