<script>
  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;
</script>

<svelte:head>
  <title>Admin Vũ trụ đồ đạc - Artemis</title>
</svelte:head>

<main class="route-surface admin-surface">
  <section class="page-heading">
    <div>
      <p class="eyebrow">Scoped admin</p>
      <h1 class="hero-title compact-title">Admin radar</h1>
    </div>
    <div class="metric-row">
      <span><strong>{data.openLostCount}</strong> lost</span>
      <span><strong>{data.openFoundCount}</strong> found</span>
      <span><strong>{data.matchCount}</strong> match</span>
    </div>
  </section>

  {#if form?.message}
    <p class="status-note">{form.message}</p>
  {/if}

  <section class="tool-panel">
    <h2>Match overview</h2>
    <div class="queue-list">
      {#each data.matches as match}
        <article class="queue-row admin-row">
          <strong>{match.level}</strong>
          <span>Lost #{match.lostItemId.slice(0, 8)} · Found #{match.foundItemId.slice(0, 8)}</span>
          <span>{match.score}%</span>
        </article>
      {:else}
        <p class="empty-state">Chưa có match cần xem.</p>
      {/each}
    </div>
  </section>

  <div class="section-grid dense-grid">
    <section class="tool-panel">
      <h2>Lost queue</h2>
      <div class="queue-list">
        {#each data.lostItems as item}
          <article class="queue-row admin-row">
            <strong>{item.description}</strong>
            <span>{item.lostAtText}</span>
            <form class="row-actions" method="POST" action="?/setStatus">
              <input type="hidden" name="kind" value="lost" />
              <input type="hidden" name="id" value={item.id} />
              <button name="status" value="matched" type="submit">Match</button>
              <button name="status" value="returned" type="submit">Returned</button>
              <button name="status" value="hidden" type="submit">Hide</button>
            </form>
          </article>
        {:else}
          <p class="empty-state">Lost queue trống.</p>
        {/each}
      </div>
    </section>

    <section class="tool-panel">
      <h2>Found queue</h2>
      <div class="queue-list">
        {#each data.foundItems as item}
          <article class="queue-row admin-row">
            <strong>{item.description}</strong>
            <span>{item.location} · {item.foundAtText}</span>
            <form class="row-actions" method="POST" action="?/setStatus">
              <input type="hidden" name="kind" value="found" />
              <input type="hidden" name="id" value={item.id} />
              <button name="status" value="matched" type="submit">Match</button>
              <button name="status" value="returned" type="submit">Returned</button>
              <button name="status" value="hidden" type="submit">Hide</button>
            </form>
          </article>
        {:else}
          <p class="empty-state">Found queue trống.</p>
        {/each}
      </div>
    </section>
  </div>
</main>
