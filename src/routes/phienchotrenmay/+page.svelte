<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Phiên chợ trên mây - Artemis</title>
</svelte:head>

<main class="route-surface">
  <section class="page-heading">
    <div>
      <p class="eyebrow">Cloud market</p>
      <h1 class="hero-title compact-title">Phiên chợ trên mây</h1>
    </div>
    <img class="heading-asset" src="/assets/artemis/reference/trade-station.png" alt="" />
  </section>

  {#if form?.message}
    <p class="status-note" data-focus={form.focus}>{form.message}</p>
  {/if}

  <section class="market-toolbar">
    <form class="search-form" method="GET">
      <label>
        <span class="sr-only">Tìm vật phẩm</span>
        <input name="q" value={data.query} placeholder="Dò mây: bàn phím, áo khoác, sách..." />
      </label>
      <button class="pill-action secondary-action" type="submit">Dò mây</button>
    </form>
    <span>{data.listings.length} vật phẩm đang sáng</span>
  </section>

  <section class="cloud-grid" aria-label="Marketplace listings">
    {#each data.listings as listing}
      <article class="cloud-card">
        <div>
          <h2>{listing.name}</h2>
          <p>{listing.description}</p>
        </div>
        <dl class="mini-facts">
          <div>
            <dt>Giá</dt>
            <dd>{listing.priceText}</dd>
          </div>
          <div>
            <dt>SL</dt>
            <dd>{listing.quantity}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{listing.contact}</dd>
          </div>
        </dl>
        <form method="POST" action="?/toggleCare">
          <input type="hidden" name="listingId" value={listing.id} />
          <button class:active-star={listing.caredByCurrentUser} class="care-button" type="submit">
            ★ {listing.careCount}
          </button>
        </form>
      </article>
    {:else}
      <p class="empty-state wide-empty">Chưa có vật phẩm nào khớp tín hiệu.</p>
    {/each}
  </section>

  <section class="tool-panel launch-panel">
    <h2>Phóng vật phẩm lên chợ</h2>
    <form class="stack-form two-column-form" method="POST" action="?/createListing" enctype="multipart/form-data">
      <label>
        Vật phẩm
        <input name="name" maxlength="180" required placeholder="Bàn phím, áo khoác, sách..." />
      </label>
      <label>
        Số lượng
        <input name="quantity" type="number" min="1" max="999" value="1" required />
      </label>
      <label class="span-two">
        Mô tả
        <textarea name="description" rows="4" maxlength="3000" required placeholder="Tình trạng, màu, kích thước, câu chuyện nhỏ..."></textarea>
      </label>
      <label>
        Giá / trao đổi
        <input name="priceText" maxlength="300" required placeholder="150k, free, đổi cà phê..." />
      </label>
      <label>
        Contact
        <input name="contact" maxlength="500" required placeholder="Email, Teams, số nội bộ..." />
      </label>
      <label class="span-two">
        Ảnh
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
      </label>
      <button class="pill-action" type="submit">Phóng vật phẩm</button>
    </form>
  </section>
</main>
