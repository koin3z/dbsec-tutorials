---
title: サンプルユーザーを準備する
description: サンプルユーザーの作成および権限付与
sidebar:
  order: 4
---

このページではチュートリアル手順にて使用するサンプルユーザーを作成します。  
前提として、サンプルスキーマが作成されていることが条件となります。

## SALES_APP
SALES アプリケーションが接続する想定ユーザーとして `SALES_APP` ユーザーを作成します。

```sql "<password>"
create user sales_app identified by <password> default tablespace users temporary tablespace temp;
```

以下は実行例です。証跡としてパスワードが残らないよう、2つのコマンドに分けて設定しています。

```text "<パスワードを入力>"
SQL> create user sales_app default tablespace users temporary tablespace temp;

User SALES_APP created.

SQL> password sales_app
New password: "<パスワードを入力>"
Retype new password: "<パスワードを再入力>"
Password changed
```

次に、SALES_APP ユーザーにセッション作成権限を付与します。

```
SQL> grant create session to sales_app;
```

さらに、HRスキーマに対して SELECT 権限を付与します。
スキーマ単位で権限付与する方法は 23ai からの新機能となっており、これにより SALES_APPユーザーは HR スキーマのテーブルに対してデータを参照できるようになります。

```
-- 23aiの新機能、スキーマ権限
SQL> grant select any table on schema HR to sales_app;
```