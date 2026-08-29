---
title: TDEに関連する初期化パラメータ
description: TDEで主に使う初期化パラメータと、関連パラメータを確認します。
sidebar:
  order: 11
---

TDEを構成するうえで、まず押さえるべき初期化パラメータは次の2つになります。

- `WALLET_ROOT` — Keystore（ウォレット）を格納するディレクトリツリーのルートを指定
- `TDE_CONFIGURATION` — TDEが使用するKeystoreの種類（FILE / OKV など）や、united / isolated の前提となる設定を定義

それぞれについて確認していきます。なお、以下の実行結果はTDE構成前の実行も含めています。


## `WALLET_ROOT`

`WALLET_ROOT` は、PDBごとのサブディレクトリを含むウォレット/キーストア格納ツリーのルートパスを指定します。
デフォルト値はなく、**静的（再起動が必要）**なパラメータです。

以下の実行はTDE構成前の結果となります。

```text
SQL> select inst_id, name, value, issys_modifiable from gv$parameter where name = 'wallet_root';

   INST_ID NAME           VALUE    ISSYS_MODIFIABLE
__________ ______________ ________ ___________________
         1 wallet_root             FALSE
```

デフォルトでは何も設定されていないことが確認できます。
また、`ISSYS_MODIFIABLE` の値が `FALSE` であるため、設定の反映に再起動が必要になります。つまり、SPFILEへ設定する静的パラメータであることが分かります。

> 参考：[26ai - 2.432 WALLET_ROOT](https://docs.oracle.com/cd/G47991_01/refrn/WALLET_ROOT.html)

## `TDE_CONFIGURATION`

`TDE_CONFIGURATION` は、ルートコンテナ（CDB$ROOT）がTDEで使用するKeystoreの種類を指定します。
統合モードでは、united PDBはCDB$ROOTの値を継承し、分離モードではisolated PDBは個別にKeystoreを持ちます。（個別に設定することで分離モードとなります）

以下の実行はTDE構成前の結果となります。

```text
SQL> select inst_id, name, value, issys_modifiable from gv$parameter where name = 'tde_configuration';

   INST_ID NAME                 VALUE    ISSYS_MODIFIABLE
__________ ____________________ ________ ___________________
         1 tde_configuration             IMMEDIATE
```

こちらもデフォルト値はなく、何も設定されていないことが確認できます。
一方、`ISSYS_MODIFIABLE` は `IMMEDIATE` のため、この設定は即時反映される動的パラメータであることが分かります。

> 参考：[26ai - 2.405 TDE_CONFIGURATION](https://docs.oracle.com/cd/G47991_01/refrn/TDE_CONFIGURATION.html)

## TDE周辺の関連パラメータ

TDEの「Keystore配置・種別」そのものは `WALLET_ROOT` および `TDE_CONFIGURATION` が中心ですが、表領域の暗号化の既定動作に関係するパラメータも、環境によっては最初から設定されていることがあります。

### `TABLESPACE_ENCRYPTION`

データベースの表領域暗号化ポリシーを指定し、新規表領域暗号化の扱い（自動/手動など）に関係します。
OCIのデータベースサービスでは暗号化が強制的に行われるため、設定が一部無視される旨も記載されています。

> DECRYPT_ONLYに設定しても無視され、クラウド・データベースは、設定がAUTO_ENABLEであるかのように動作します。

> 参考：[26ai - 2.402 TABLESPACE_ENCRYPTION](https://docs.oracle.com/cd/G47991_01/refrn/TABLESPACE_ENCRYPTION.html)

### `ENCRYPT_NEW_TABLESPACES`

新しく作成されたユーザー表領域を暗号化するかどうかを指定します。  
26aiでは使用は非推奨となっており、代替として上記の `TABLESPACE_ENCRYPTION` パラメータを使用します。

> 参考：[26ai - 2.134 ENCRYPT_NEW_TABLESPACES](https://docs.oracle.com/cd/G47991_01/refrn/ENCRYPT_NEW_TABLESPACES.html)


### `TDE_KEY_CACHE`

Oracleプロセス間でTDEマスター暗号キーの共有を有効または無効にします。  
TDEの鍵管理にOCI KMS（OCI Vault）を使用しているデータベースのみで使用できるパラメータです。

> 参考：[26ai - 2.406 TDE_KEY_CACHE](https://docs.oracle.com/cd/G47991_01/refrn/TDE_KEY_CACHE.html)

### `TABLESPACE_ENCRYPTION_DEFAULT_ALGORITHM`

表領域の暗号化時にデータベースで使用されるデフォルトのアルゴリズムを指定します。
26aiからはGOST、SEEDはサポートが終了となっています。しかし、HP Itaniumプラットフォームを除いて、Oracle AI Database 26aiではGOSTおよびSEED復号ライブラリが使用できるため、アップグレード後に復号することは可能です。

> 参考：[26ai - 2.403 TABLESPACE_ENCRYPTION_DEFAULT_ALGORITHM](https://docs.oracle.com/cd/G47991_01/refrn/TABLESPACE_ENCRYPTION_DEFAULT_ALGORITHM.html)


## 参考

初期状態では各パラメータは以下のようになっています。

```
SQL> sho parameter tde
NAME                             TYPE    VALUE
-------------------------------- ------- ---------------------------
one_step_plugin_for_pdb_with_tde boolean FALSE
tde_configuration                string  keystore_configuration=file
tde_key_cache                    boolean FALSE

SQL> sho parameter encry
NAME                                      TYPE   VALUE
----------------------------------------- ------ -------------
encrypt_new_tablespaces                   string CLOUD_ONLY
tablespace_encryption                     string MANUAL_ENABLE
tablespace_encryption_default_algorithm   string AES256
tablespace_encryption_default_cipher_mode string XTS
```


## 関連サイト
- [`WALLET_ROOT` - 26ai](https://docs.oracle.com/cd/G47991_01/refrn/WALLET_ROOT.html)
- [`TDE_CONFIGURATION` - 26ai](https://docs.oracle.com/cd/G47991_01/refrn/TDE_CONFIGURATION.html) 