# 作業中（WIP）

## 現在の作業: Webフロントエンド開発（Phase 1）

### 進行状況
- [x] 設計ドキュメント作成（doc/design/chat/web-frontend-design.md）
- [x] tasksファイルの更新
- [ ] プロジェクト構造の初期セットアップ

### 今後の作業計画
1. frontend/ と backend/ フォルダを作成してプロジェクト分離
2. Vue.js 3 + Vite プロジェクトの作成
3. Express.js API サーバーの作成
4. 既存TypeScriptモジュールの統合

### 技術的な注意点
- 既存のsrc/modules/配下のモジュールをバックエンドで再利用
- フロントエンド・バックエンド間のAPI設計を明確にする
- キャッシュ戦略とセキュリティ対策を初期から考慮
- Vue3 Composition APIを活用した構成にする