<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Admin Phiên chợ trên mây - Artemis</title>
</svelte:head>

<main class="route-surface admin-surface">
  <section class="page-heading">
    <div>
      <p class="eyebrow">Scoped admin</p>
      <h1 class="hero-title compact-title">Admin chợ</h1>
    </div>
    <div class="metric-row">
      <span><strong>{data.pendingCount}</strong> pending</span>
      <span><strong>{data.approvedCount}</strong> approved</span>
      <span><strong>{data.hiddenCount}</strong> hidden</span>
    </div>
  </section>

  {#if form?.message}
    <p class="status-note">{form.message}</p>
  {/if}

  <section class="tool-panel">
    <h2>Listing queue</h2>
    <div class="queue-list">
      {#each data.listings as listing}
        <article class="queue-row admin-row">
          <div>
            <strong>{listing.name}</strong>
            <span>{listing.priceText} · {listing.contact} · {listing.status}</span>
          </div>
          <form class="row-actions" method="POST" action="?/setStatus">
            <input type="hidden" name="id" value={listing.id} />
            <button name="status" value="approved" type="submit">Approve</button>
            <button name="status" value="rejected" type="submit">Reject</button>
            <button name="status" value="hidden" type="submit">Hide</button>
            <button name="status" value="approved" type="submit">Show</button>
            <button name="status" value="passed" type="submit">Passed</button>
          </form>
        </article>
      {:else}
        <p class="empty-state">Listing queue trống.</p>
      {/each}
    </div>
  </section>
</main>
