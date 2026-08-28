# Oracle Database Security チュートリアル

Oracle Database のセキュリティ機能を実際に動かしながら学ぶための，チュートリアルと Tips をまとめたサイトのソースです。
環境構築から設定・検証手順・注意点まで，できるだけ手順ベースで整理しています。

- 公開サイト: <https://koin3z.github.io/dbsec-tutorials/>
- サイトの目的・対象読者・免責事項: 公開サイトの「このサイトについて」を参照してください。

## 扱うトピック

Oracle Database に組み込まれたセキュリティ機能を，機能ごとのチュートリアルとして扱います。

- 認証 — MFA，OCI IAM や Microsoft Entra ID との連携
- アクセス制御 — Virtual Private Database，Database Vault，Oracle Label Security，SQL Firewall（23ai 新機能）など
- 暗号化 — TDE（透過的データ暗号化），ネイティブ・ネットワーク暗号化
- データ編集・マスキング — Data Redaction など
- 運用・監査 — 監査ポリシーの設計と確認

## 前提とする環境

- **Oracle Database 26ai FREE** を基本の実行環境とします。
- OCI IAM 連携や MFA など，クラウドサービスと組み合わせる手順では Autonomous Database または Base Database Service を使用します。
- クライアントは **SQLcl**，サンプルは公式の **HR スキーマ** を用います。

## フィードバック

誤りの指摘や改善の提案は Issue / Pull Request でお願いします。