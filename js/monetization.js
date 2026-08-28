(function () {
  "use strict";

  const config = window.GENBA_MONETIZATION_CONFIG;
  if (!config) return;

  const cacheKey = "genba.monetization.removeAds.v1";
  const state = { platform: "web", removeAds: false, products: new Map(), ready: false };

  function plugin(name) {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name];
  }

  function platform() {
    const value = window.Capacitor && typeof window.Capacitor.getPlatform === "function"
      ? window.Capacitor.getPlatform() : "web";
    return value === "ios" || value === "android" ? value : "web";
  }

  function track(name, details) {
    const payload = Object.assign({ event: name, source: state.platform, timestamp: new Date().toISOString() }, details || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent("genba:analytics", { detail: payload }));
  }

  function setStatus(message, kind) {
    const node = document.getElementById("monetizationStatus");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.kind = kind || "";
  }

  function productId(product) {
    return product && (product.productIdentifier || product.identifier || product.id);
  }

  function formattedPrice(product) {
    return product && (product.priceString || product.formattedPrice || product.displayPrice || "");
  }

  function transactionId(transaction) {
    return transaction && (transaction.productIdentifier || transaction.productId || transaction.identifier);
  }

  function updateUI() {
    const panel = document.getElementById("monetizationPanel");
    if (!panel) return;
    panel.hidden = !config.monetizationEnabled || state.platform === "web";
    panel.querySelectorAll("[data-pro-only]").forEach((node) => { node.hidden = !state.removeAds; });
    panel.querySelectorAll("[data-free-only]").forEach((node) => { node.hidden = state.removeAds; });
    const removeProduct = state.products.get(config.products.removeAds[state.platform]);
    const price = formattedPrice(removeProduct);
    const priceNode = panel.querySelector("[data-price='removeAds']");
    const purchaseButton = panel.querySelector("[data-purchase='removeAds']");
    if (priceNode) priceNode.textContent = price;
    if (purchaseButton) purchaseButton.disabled = !removeProduct || state.removeAds;
  }

  async function syncEntitlement(options) {
    const purchases = plugin("NativePurchases");
    if (!purchases) return false;
    if (options && options.restore) await purchases.restorePurchases();
    const result = await purchases.getPurchases({ productType: "inapp", onlyCurrentEntitlements: true });
    const removeId = config.products.removeAds[state.platform];
    state.removeAds = Boolean((result.purchases || []).some((item) => transactionId(item) === removeId));
    localStorage.setItem(cacheKey, state.removeAds ? "1" : "0");
    if (state.removeAds) await hideBanner();
    updateUI();
    return state.removeAds;
  }

  async function loadProducts() {
    const purchases = plugin("NativePurchases");
    if (!purchases) return;
    const ids = [config.products.removeAds[state.platform]].filter(Boolean);
    const result = await purchases.getProducts({ productIdentifiers: ids, productType: "inapp" });
    (result.products || []).forEach((item) => state.products.set(productId(item), item));
    updateUI();
  }

  async function showBanner() {
    if (state.removeAds) return;
    const admob = plugin("AdMob");
    const adId = config.admob.bannerIds[state.platform];
    if (!admob || !adId) return;
    admob.addListener("bannerAdFailedToLoad", function () { track("ad_banner_failed"); });
    admob.addListener("bannerAdImpression", function () { track("ad_banner_impression"); });
    admob.addListener("bannerAdOpened", function () { track("ad_banner_click"); });
    await admob.initialize({ initializeForTesting: Boolean(config.testMode) });
    let consent = await admob.requestConsentInfo();
    if (!consent.canRequestAds && consent.isConsentFormAvailable) consent = await admob.showConsentForm();
    if (!consent.canRequestAds) return;
    await admob.showBanner({
      adId,
      adSize: "ADAPTIVE_BANNER",
      position: "BOTTOM_CENTER",
      margin: 0,
      isTesting: Boolean(config.testMode)
    });
    track("ad_banner_loaded");
  }

  async function hideBanner() {
    const admob = plugin("AdMob");
    if (admob) await admob.hideBanner().catch(function () {});
  }

  async function buyRemoveAds() {
    const purchases = plugin("NativePurchases");
    const id = config.products.removeAds[state.platform];
    if (!purchases || !state.products.has(id)) return;
    setStatus("購入画面を開いています…");
    track("remove_ads_purchase_started");
    try {
      await purchases.purchaseProduct({ productIdentifier: id, productType: "inapp", isConsumable: false });
      await syncEntitlement();
      if (!state.removeAds) throw new Error("購入状態を確認できませんでした。");
      setStatus("広告削除を有効にしました。", "success");
      track("remove_ads_purchase_success");
    } catch (error) {
      setStatus("購入を完了できませんでした。", "error");
      track("remove_ads_purchase_failed");
    }
  }

  async function restore() {
    setStatus("購入情報を確認しています…");
    track("restore_purchase_started");
    try {
      const restored = await syncEntitlement({ restore: true });
      setStatus(restored ? "購入を復元しました。" : "復元できる購入はありません。", restored ? "success" : "");
      track(restored ? "restore_purchase_success" : "restore_purchase_empty");
    } catch (error) {
      setStatus("購入情報を確認できませんでした。", "error");
      track("restore_purchase_failed");
    }
  }

  function bindUI() {
    document.querySelector("[data-purchase='removeAds']")?.addEventListener("click", buyRemoveAds);
    document.querySelector("[data-restore-purchases]")?.addEventListener("click", restore);
    document.querySelector("[data-privacy-options]")?.addEventListener("click", async function () {
      const admob = plugin("AdMob");
      if (admob) await admob.showPrivacyOptionsForm();
    });
    document.getElementById("customizeMenuBtn")?.addEventListener("click", function () {
      if (config.monetizationEnabled && state.platform !== "web") track("remove_ads_viewed");
    });
  }

  async function initialize() {
    state.platform = platform();
    state.removeAds = localStorage.getItem(cacheKey) === "1";
    bindUI();
    updateUI();
    if (!config.monetizationEnabled || state.platform === "web") return;
    try {
      await Promise.all([loadProducts(), syncEntitlement()]);
      await showBanner();
      state.ready = true;
    } catch (error) {
      setStatus("ストア情報を取得できませんでした。後でもう一度お試しください。", "error");
      track("monetization_init_failure");
    }
  }

  window.GenbaMonetization = { initialize, restore, refreshEntitlement: syncEntitlement };
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
})();
