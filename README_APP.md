現場電卓 App化用フォルダ
========================

起動確認:
  npm install
  npm run start

ブラウザ確認:
  http://localhost:3003/

ネイティブ同期:
  npm run cap:sync

ネイティブプロジェクト:
  iOS: ios/App/App.xcodeproj
  Android: android/

iPhone確認:
  MacとiPhoneを同じWi-Fiに接続し、MacのIPを確認してから Safari で開く。
  例: http://<MacのIP>:3003/index.html

構成:
  index.html        アプリ本体HTML
  css/styles.css    画面デザイン
  js/app.js         計算・保存・PDF出力ロジック
  vendor/           PDF出力用ローカルライブラリ
  assets/           将来用素材
  assets/screenshots/ ストア・確認用スクリーンショット
  icons/            アイコン素材

注意:
  localStorageキーは既存互換を維持。
  PDF出力は vendor/html2canvas.min.js と vendor/jspdf.umd.min.js を使用。
  外部ページ遷移は削減し、1本のWebアプリとして整理済み。
