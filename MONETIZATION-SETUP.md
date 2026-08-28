# 現場電卓 収益化有効化手順

現在は `js/monetization-config.js` の `monetizationEnabled: false` により、広告・購入UI・広告用余白をすべて無効化しています。

## 本番ID

有効化前に次のテスト値を本番値へ置換します。

- iOS AdMob App ID: `ios/App/App/Info.plist`
- Android AdMob App ID: `android/app/src/main/res/values/strings.xml`
- iOS / Android Banner Unit ID: `js/monetization-config.js`

`testMode` を `false` にし、実機テスト完了後にだけ `monetizationEnabled` を `true` にします。切り戻しは同フラグを `false` にして再ビルドします。

## ストア商品

買い切り・非消費型の広告削除商品を作成し、IDを設定ファイルと完全一致させます。

- iOS: `jp.genba.calculator.remove_ads`
- Android: `remove_ads`

表示価格はコードへ固定せず、App Store / Google Playの商品情報から取得します。Sandboxテスター、Google Playライセンステスターで購入・復元・キャンセルを確認してください。

## 同意とプライバシー

広告表示前にGoogle UMPで同意情報を更新し、必要な地域で同意フォームを表示します。現在ATTは要求しません。将来トラッキング許可が必要な広告構成へ変える場合のみ、利用目的文を追加して適切なタイミングでATTを要求してください。

ストア申告では、実際に有効化した広告SDK・購入機能に合わせてApp Privacy / Data safetyを更新し、公開済みプライバシーポリシーも再確認します。

## app-ads.txt

`app-ads.txt.example` のpublisher IDをAdMob記載値へ置換し、ストアに登録した開発者Webサイトのルートへ `app-ads.txt` として公開します。プレースホルダーのまま公開しないでください。

## 有効化順

1. AdMobでアプリとバナー枠を作成
2. UMPでGDPR・米国州法向けメッセージを設定
3. Apple / Googleで広告削除商品を作成・承認
4. 本番IDへ置換し、Sandboxとテスト広告で確認
5. プライバシー申告とポリシーを更新
6. `testMode: false`、`monetizationEnabled: true` にしてストア提出

計測イベント: `ad_banner_loaded`, `ad_banner_failed`, `ad_banner_impression`, `ad_banner_click`, `remove_ads_viewed`, `remove_ads_purchase_started`, `remove_ads_purchase_success`, `remove_ads_purchase_failed`, `restore_purchase_started`, `restore_purchase_success`, `restore_purchase_empty`, `restore_purchase_failed`。

管理画面でしか行えない作業と登録文言は `MONETIZATION-CONSOLE-CHECKLIST.md`、実機検証は `MONETIZATION-DEVICE-TEST-CHECKLIST.md` を参照してください。ID反映とapp-ads.txt生成は同チェックリスト記載のスクリプトで実行できます。
