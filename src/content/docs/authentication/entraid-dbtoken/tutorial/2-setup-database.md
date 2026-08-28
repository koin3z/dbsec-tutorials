---
title: 2. Databaseの設定
description: EntraIDのクライアント設定
sidebar:
  order: 2
---

このセクションでは、Oracle Database 側で Entra ID と連携するための設定を行います。

> **実施内容**
> - Database パラメータの設定
> - Entra ID ユーザーに対応する DB ユーザーの作成
> - トークン認証による接続確認

## 2-1. Databaseの設定

対象の PDB に接続し、現在の設定値を確認します。

```shell
SQL> alter session set container=freepdb1;

Session altered.

SQL> sho user con_name
USER is "SYS"
CON_NAME
------------------------------
FREEPDB1
SQL> select name, value from v$parameter where name='identity_provider_type';

NAME                      VALUE
_________________________ ________
identity_provider_type    NONE
```

続いて、IDENTITY_PROVIDER_TYPE パラメータを設定します。

```
alter system set IDENTITY_PROVIDER_TYPE=AZURE_AD scope=both;
```

設定されたかを確認します。

```sql
SQL> select name, value from v$parameter where name='identity_provider_type';

NAME                      VALUE
_________________________ ___________
identity_provider_type    AZURE_AD
```

次に、`1-1.` の手順で控えた以下の情報を設定します。
- アプリケーション ID
- テナント ID
- アプリケーション ID URI

```
alter system set identity_provider_config =
'{
  "application_id_uri": "<アプリケーション ID URI>",
  "tenant_id": "<テナント ID>",
  "app_id": "<アプリケーション ID>"
}' scope=both;
```

設定したパラメータを確認します。

```sql
SQL> show parameter identity
NAME                     TYPE   VALUE                                                                                                
------------------------ ------ ---------------------------------------------------------------------------------------------------- 
identity_provider_config string {                                                                                                    
                                    "application_id_uri": "api://f60db47c-2616-43e5-abd2-de8180684380",  
                                    "tenant_id": "d555f6ae  

identity_provider_type   string AZURE_AD   
```

## 2-2. EntraID ユーザーの作成

Database 上で、Entra ID のユーザーに紐付く形で DB ユーザーを作成します。
ここではユーザーに紐付ける例を示していますが、アプリロールに紐付けることも可能です。

```
create user entraid_user identified globally as 'AZURE_USER=<Entra ID ユーザー名>';
```

続いて、接続に必要な権限を付与します。

```
grant create session to entraid_user;
```

※ アプリロールに紐付ける場合は、以下のように作成します。

```
CREATE USER <DBユーザー> IDENTIFIED GLOBALLY AS 'AZURE_ROLE=<EntraID ロール名>';
CREATE ROLE <DBロール名> IDENTIFIED GLOBALLY AS 'AZURE_ROLE=<EntraID ロール名>';
```


