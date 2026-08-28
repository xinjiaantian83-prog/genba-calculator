(function () {
  "use strict";

  window.GENBA_MONETIZATION_CONFIG = Object.freeze({
    monetizationEnabled: false,
    locale: "ja-JP",
    market: "jp",
    testMode: true,
    admob: {
      bannerIds: {
        ios: "ca-app-pub-3940256099942544/2934735716",
        android: "ca-app-pub-3940256099942544/6300978111"
      }
    },
    products: {
      removeAds: {
        ios: "jp.genba.calculator.remove_ads",
        android: "remove_ads"
      },
      tips: []
    }
  });
})();
