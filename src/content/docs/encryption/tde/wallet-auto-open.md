---
title: キーストアの自動オープン
description: 自動ログイン・キーストア（AUTOLOGIN）を作成し、DB再起動後にキーストアが自動でOPENされることを確認します。
sidebar:
  order: 12
---

> **実施内容**
> - 自動ログインのキーストアを作成する
> - DBが再起動した際、キーストアが自動でOPENするかを確認する

> **前提条件**
> - Keystoreが作成されていること


データベースを再起動すると、Keystoreは通常 `CLOSED` に戻るため、暗号化表領域を利用するには明示的に `OPEN` の操作が必要になります。

```text title="[CDB] SYSユーザー"
SQL> select * from v$encryption_wallet;

WRL_TYPE    WRL_PARAMETER                         STATUS    WALLET_TYPE    WALLET_ORDER    KEYSTORE_MODE    FULLY_BACKED_UP       CON_ID
___________ _____________________________________ _________ ______________ _______________ ________________ __________________ _________
FILE        /opt/oracle/admin/FREE/wallet/tde/    CLOSED    UNKNOWN        SINGLE          NONE             UNDEFINED                  1
FILE                                              CLOSED    UNKNOWN        SINGLE          UNITED           UNDEFINED                  2
FILE                                              CLOSED    UNKNOWN        SINGLE          UNITED           UNDEFINED                  3
```

手動ですべてのコンテナのKeystoreをOPENする場合は次のコマンドです。

```sql
administer key management set keystore open identified by <password> container=all;
```

そこで、ここでは自動ログインキーストアを作成し、Databaseが起動した際に自動でオープンするように設定を行います。


## 1. キーストアをオープンする

まずキーストアが閉じている場合、Keystoreが OPEN できる状態であることを確認します。

オープンしていない場合、以下の手順にてキーストアをオープンします。

```text title="[CDB] SYSユーザー"
SQL> administer key management set keystore open identified by OracleKM123# container = all;

-- オープンしていることを確認する
SQL> select * from v$encryption_wallet;

WRL_TYPE    WRL_PARAMETER                         STATUS    WALLET_TYPE    WALLET_ORDER    KEYSTORE_MODE    FULLY_BACKED_UP       CON_ID
___________ _____________________________________ _________ ______________ _______________ ________________ __________________ _________
FILE        /opt/oracle/admin/FREE/wallet/tde/    OPEN      PASSWORD       SINGLE          NONE             NO                         1
FILE                                              OPEN      PASSWORD       SINGLE          UNITED           NO                         2
FILE                                              OPEN      PASSWORD       SINGLE          UNITED           NO                         3
```

`container=all` を付けないと、ルートだけOPENして PDB側が CLOSED のままになるため、ここでは container=all を付けて揃えます。`container = all` 句を忘れた場合、その後PDBに別途接続しOPENするコマンドを実行します。


## 2. 自動ログイン・キーストアを作成

既存のKeystoreから、自動ログイン・キーストアを作成します。

```sql
administer key management create auto_login keystore from keystore identified by OracleKM123#;
```

この操作により、同ディレクトリに `cwallet.sso` が作成されます。
`LOCAL` を付けると「そのホストでしか開けない」自動ログインになり、他ホストへコピーして使えません。付けない場合は、原則として他ホストでも開ける自動ログインが作られます。

必要に応じてKeystoreのファイルを確認します。この時点で `cwallet.sso` が作成され、 `ewallet` のバックアップも作成されたことが確認できます。  

```text title="[CDB] SYSユーザー"
-- 作成されたキーストアを確認
SQL> !ls -l /opt/oracle/admin/FREE/wallet/tde/
total 24
-rw-------. 1 oracle oinstall 5488 Feb 19 13:22 cwallet.sso
-rw-------. 1 oracle oinstall 2563 Feb  9 04:12 ewallet_2026020904125329.p12
-rw-------. 1 oracle oinstall 4003 Feb  9 04:28 ewallet_2026020904280577.p12
-rw-------. 1 oracle oinstall 5443 Feb  9 04:28 ewallet.p12
-rw-------. 1 oracle oinstall    0 Feb  9 04:08 ewallet.p12.lck
```

CDBで実行していますが、今回の環境ではPDBも同じKeystoreを共有しているため、PDBも自動でオープンされることになります。

## 3. DB再起動後に自動で OPEN されることを確認

データベースを再起動し、Keystoreが自動でオープンされるかを確認します。

```
shu immediate
startup
```
再起動後、`v$encryption_wallet` を確認します。

```text title="[CDB] SYSユーザー"
SQL> shu immediate
Database closed.
Database dismounted.
ORACLE instance shut down.
SQL> startup
ORACLE instance started.

Total System Global Area   1603375136 bytes
Fixed Size                    5009440 bytes
Variable Size               687865856 bytes
Database Buffers            905969664 bytes
Redo Buffers                  4530176 bytes
Database mounted.
Database opened.
SQL> select * from v$encryption_wallet;

WRL_TYPE    WRL_PARAMETER                         STATUS    WALLET_TYPE    WALLET_ORDER    KEYSTORE_MODE    FULLY_BACKED_UP       CON_ID
___________ _____________________________________ _________ ______________ _______________ ________________ __________________ _________
FILE        /opt/oracle/admin/FREE/wallet/tde/    OPEN      AUTOLOGIN      SINGLE          NONE             NO                         1
FILE                                              OPEN      AUTOLOGIN      SINGLE          UNITED           NO                         2
FILE                                              OPEN      AUTOLOGIN      SINGLE          UNITED           NO                         3
```

結果を確認すると、STATUS列が `OPEN`、WALLET_TYPE列が `AUTOLOGIN` となっており、再起動後も自動でKeystoreがオープンされたことがわかります。