---
title: 4. Database Vaultの無効化
description: Database Vaultのレルム・認可・オブジェクト・ルールセット等の削除と無効化手順を解説します。
sidebar:
  order: 4
---

Database Vaultで設定したレルムおよび関連する認可、オブジェクト登録を削除し、Database Vault自体を無効化します。

## 概要

- レルムの無効化
- レルム認可の削除
- レルムからのオブジェクト削除
- レルム自体の削除
- ルールセットの削除
- Database Vaultの無効化

## レルムの無効化
作成したレルム (Realm for demo) を無効化します。

```sql title="C##DVOWNERユーザー"
BEGIN
  DBMS_MACADM.UPDATE_REALM(
    realm_name   => 'Realm for demo',
    enabled      => DBMS_MACUTL.G_NO);
END;
/
```

## レルム認可の削除

レルム内のオブジェクトへのアクセス権を付与した認可を削除します。

```sql title="C##DVOWNERユーザー"
-- HRユーザーの認可を削除
BEGIN
  DBMS_MACADM.DELETE_AUTH_FROM_REALM(
    realm_name    => 'Realm for demo',
    grantee       => 'HR',
    auth_scope    => DBMS_MACUTL.G_SCOPE_LOCAL);
END;
/

-- SALES_APPユーザーの認可を削除
BEGIN
  DBMS_MACADM.DELETE_AUTH_FROM_REALM(
    realm_name    => 'Realm for demo',
    grantee       => 'SALES_APP',
    auth_scope    => DBMS_MACUTL.G_SCOPE_LOCAL);
END;
/

-- APPユーザーの認可を削除
BEGIN
  DBMS_MACADM.DELETE_AUTH_FROM_REALM(
    realm_name    => 'Realm for demo',
    grantee       => 'APP',
    auth_scope    => DBMS_MACUTL.G_SCOPE_LOCAL);
END;
/
```

完全に削除されたことを確認します。

```text title="C##DVOWNERユーザー"
SQL> select realm_name, grantee from DVSYS.DBA_DV_REALM_AUTH where realm_name = 'Realm for demo';

no rows selected
```

## レルムからのオブジェクト削除

レルムに登録されていたオブジェクト (COUNTRIES表とREGIONS表) を削除します。

```sql title="C##DVOWNERユーザー"
-- COUNTRIES表をレルムから削除
BEGIN
  DBMS_MACADM.DELETE_OBJECT_FROM_REALM(
    realm_name   => 'Realm for demo',
    object_owner => 'HR',
    object_name  => 'COUNTRIES',
    object_type  => 'TABLE');
END;
/

-- REGIONS表をレルムから削除
BEGIN
  DBMS_MACADM.DELETE_OBJECT_FROM_REALM(
    realm_name   => 'Realm for demo',
    object_owner => 'HR',
    object_name  => 'REGIONS',
    object_type  => 'TABLE');
END;
/
```
オブジェクトがレルムから削除されたことを確認します。

```text title="C##DVOWNERユーザー"
SQL> select REALM_NAME, OWNER, OBJECT_NAME, OBJECT_TYPE from DVSYS.DBA_DV_REALM_OBJECT where realm_name = 'Realm for demo';

no rows selected
```

## レルムの削除

最後にレルム自体を削除します。

```sql title="C##DVOWNERユーザー"
BEGIN
  DBMS_MACADM.DELETE_REALM(realm_name => 'Realm for demo');
END;
/
```

## ルールセットの削除

ルール・セットを削除します。

```sql title="C##DVOWNERユーザー"
EXEC DBMS_MACADM.DELETE_RULE_SET('Ruleset for APP');
```

## Database Vaultの無効化

```text title="C##DVOWNERユーザー"
EXEC DBMS_MACADM.DISABLE_DV;

-- 無効化されたことを確認する
SQL> SELECT * FROM CDB_DV_STATUS;

NAME                   STATUS               CON_ID
______________________ _________________ _________
DV_CONFIGURE_STATUS    TRUE                      3
DV_ENABLE_STATUS       FALSE                     3
DV_APP_PROTECTION      NOT CONFIGURED            3
```

CDBに接続し、PDBを再起動します。

```sql title="[CDB] SYSユーザー"
ALTER PLUGGABLE DATABASE freepdb1 CLOSE IMMEDIATE;
ALTER PLUGGABLE DATABASE freepdb1 OPEN;
```

SYSユーザーでDBユーザーが作成できるようになり、Database Vaultが無効化されたことが分かります。

```text title="[PDB] SYSユーザー"
show user con_name
-- USER is "SYS"
-- CON_NAME: FREEPDB1

SQL> create user test;

User TEST created.

SQL> drop user test;

User TEST dropped.
```

以上でDatabase Vaultのデモは終了です。