# 現場電卓：管理画面でのみ必要な作業

コード変更、ID反映、app-ads.txt生成、ビルドはローカルで自動化済み／自動化可能です。以下だけは各サービスへのログイン、規約同意、商品作成、申告、審査資料登録が必要です。

## 日本版 iOS

### AdMob

- [ ] AdMob > アプリ > アプリを追加 > iOSで「現場電卓」を登録する（App Store公開済みアプリを選択）。
- [ ] 広告ユニット > バナーを作成する。推奨名：`現場電卓 iOS Bottom Banner`。
- [ ] プライバシーとメッセージ > GDPR / 米国州法の同意メッセージを作成・公開する。
- [ ] 発行されたiOS App ID、Banner Unit ID、Publisher IDを控える。

### App Store Connect

- [ ] 現場電卓 > アプリ内課金 > 非消耗型を作成する。
  - Product ID：`jp.genba.calculator.remove_ads`
  - 参照名：`現場電卓 広告削除`
  - 日本語表示名：`広告を削除`
  - 日本語説明：`買い切りでアプリ内の広告表示を削除します。`
  - 英語表示名：`Remove Ads`
  - 英語説明：`One-time purchase to remove ads from the app.`
  - 推奨価格：¥480（既存ユーザーへの負担を抑えた買い切り価格。管理画面の価格ポイントから最も近い値を選択）
- [ ] 審査用スクリーンショットとして、実機の収益化パネルに「広告を削除」と価格が表示された画面を1枚登録する。
- [ ] Review Notes：`「その他ツール」下の収益化欄から購入できます。非消耗型で、購入後はバナー広告を非表示にします。「購入を復元」から復元できます。`
- [ ] App Privacyを実際のAdMob / UMP / 購入SDKのデータ取扱いに合わせて更新する。

## 日本版 Android

### AdMob

- [ ] AdMob > アプリ > アプリを追加 > Androidで「現場電卓」を登録する（Google Play公開済みアプリを選択）。
- [ ] バナー広告ユニットを作成する。推奨名：`現場電卓 Android Bottom Banner`。
- [ ] iOSと同じ同意メッセージの対象アプリへAndroid版を追加する。
- [ ] 発行されたAndroid App ID、Banner Unit IDを控える。

### Google Play Console

- [ ] 収益化 > 商品 > アプリ内アイテムで商品を作成・有効化する。
  - Product ID：`remove_ads`
  - 種別：買い切りの非消費型商品
  - 日本語名：`広告を削除`
  - 日本語説明：`買い切りでアプリ内の広告表示を削除します。`
  - 英語名：`Remove Ads`
  - 英語説明：`One-time purchase to remove ads from the app.`
  - 推奨価格：¥480（他地域はGoogleの自動換算後に確認）
- [ ] 設定 > ライセンステストへテスト用Googleアカウントを追加する。
- [ ] アプリのコンテンツ > 広告を「広告を含む」へ更新し、データセーフティを実際のSDK動作に合わせて更新する。

## ID受領後にローカルで行う作業

```bash
node scripts/configure-monetization-ids.mjs \
  --ios-app-id=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY \
  --android-app-id=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY \
  --ios-banner-id=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY \
  --android-banner-id=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY

node scripts/generate-app-ads.mjs --publisher-id=pub-XXXXXXXXXXXXXXXX
```

このスクリプトは`monetizationEnabled`と`testMode`を変更しません。
