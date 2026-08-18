<script>
  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;
</script>

<svelte:head>
  <title>Vũ trụ đồ đạc - Artemis</title>
</svelte:head>

<main class="route-surface">
  <section class="page-heading">
    <div>
      <p class="eyebrow">Radar moon</p>
      <h1 class="hero-title compact-title">Vũ trụ đồ đạc</h1>
    </div>
    <img class="heading-asset" src="/assets/artemis/reference/lost-signal.png" alt="" />
  </section>

  {#if form?.message}
    <p class="status-note" data-focus={form.focus}>{form.message}</p>
  {/if}

  <div class="section-grid">
    <section class="tool-panel">
      <h2>Tín hiệu tìm đồ</h2>
      <form class="stack-form" method="POST" action="?/createLost" enctype="multipart/form-data">
        <label>
          Món đồ
          <textarea name="description" rows="4" maxlength="2000" required placeholder="Bình nước xanh, tai nghe, thẻ xe..."></textarea>
        </label>
        <label>
          Thời điểm mất
          <input name="lostAtText" maxlength="500" required placeholder="Ví dụ: sáng nay ở pantry tầng 12" />
        </label>
        <label>
          Ảnh
          <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>
        <button class="pill-action" type="submit">Bay vào vũ trụ</button>
      </form>
    </section>

    <section class="tool-panel">
      <h2>Tín hiệu trả đồ</h2>
      <form class="stack-form" method="POST" action="?/createFound" enctype="multipart/form-data">
        <label>
          Món nhặt được
          <textarea name="description" rows="4" maxlength="2000" required placeholder="Mô tả màu, nhãn, dấu hiệu nhận biết"></textarea>
        </label>
        <label>
          Thời điểm nhặt
          <input name="foundAtText" maxlength="500" required placeholder="Ví dụ: cuối ngày hôm qua" />
        </label>
        <label>
          Vị trí
          <input name="location" maxlength="500" required placeholder="Pantry, thang máy, phòng họp..." />
        </label>
        <label>
          Ảnh
          <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>
        <button class="pill-action" type="submit">Bật beacon</button>
      </form>
    </section>
  </div>

  <section class="radar-band" aria-label="Radar matches">
    <div class="moon-card mini-moon">
      <img src="/assets/artemis/reference/moon.png" alt="" />
      <p>{data.matches.length ? `${data.matches.length} tín hiệu gần nhau` : 'Radar đang lắng nghe'}</p>
    </div>
    <div class="queue-list">
      <h2>Match radar</h2>
      {#if data.matches.length}
        {#each data.matches as match}
          <article class="queue-row">
            <strong>{match.level === 'strong' ? 'Tín hiệu mạnh' : 'Tín hiệu gần'}</strong>
            <span>Lost #{match.lostItemId.slice(0, 8)} · Found #{match.foundItemId.slice(0, 8)}</span>
            <span>{match.score}%</span>
          </article>
        {/each}
      {:else}
        <p class="empty-state">Chưa có tín hiệu trùng đủ gần.</p>
      {/if}
    </div>
  </section>

  <div class="section-grid dense-grid">
    <section class="tool-panel">
      <h2>Đồ đang tìm</h2>
      <div class="queue-list">
        {#each data.lostItems as item}
          <article class="queue-row">
            <strong>{item.description}</strong>
            <span>{item.lostAtText}</span>
            <span class="status-pill">{item.status}</span>
          </article>
        {:else}
          <p class="empty-state">Chưa có tín hiệu tìm đồ.</p>
        {/each}
      </div>
    </section>

    <section class="tool-panel">
      <h2>Đồ nhặt được</h2>
      <div class="queue-list">
        {#each data.foundItems as item}
          <article class="queue-row">
            <strong>{item.description}</strong>
            <span>{item.location} · {item.foundAtText}</span>
            <span class="status-pill">{item.status}</span>
          </article>
        {:else}
          <p class="empty-state">Chưa có beacon trả đồ.</p>
        {/each}
      </div>
    </section>
  </div>

  <section class="tool-panel">
    <h2>Thông báo</h2>
    <div class="queue-list">
      {#each data.notifications as notification}
        <article class:muted-row={notification.readAt} class="queue-row">
          <strong>{notification.type}</strong>
          <span>{notification.message}</span>
          {#if !notification.readAt}
            <form method="POST" action="?/markNotification">
              <input type="hidden" name="notificationId" value={notification.id} />
              <button class="icon-button text-button" type="submit">Đã đọc</button>
            </form>
          {/if}
        </article>
      {:else}
        <p class="empty-state">Chưa có thông báo mới.</p>
      {/each}
    </div>
  </section>
</main>
