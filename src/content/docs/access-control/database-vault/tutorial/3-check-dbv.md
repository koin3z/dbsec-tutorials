---
title: 3. 動作を確認する
description: レルム認可やIPアドレス制限など、Database Vaultの動作確認手順を解説します。
sidebar:
  order: 3
---

このページでは、Database Vaultのレルム認可やIPアドレス制限など、動作確認の手順を解説します。

## 概要

- SYSユーザーのアクセス制限確認
- HR/SALES_APPユーザーのアクセス確認
- APPユーザーのIPアドレス制限確認

## SYSユーザーのアクセス制限確認

Database Vaultが有効化された環境では、SYSユーザーはユーザー作成や特定オブジェクトへのアクセスができません。

```text
-- SYSユーザーでユーザー作成を試みる
SQL> CREATE USER test;

Error starting at line : 1 in command -
CREATE USER test
Error report -
ORA-01031: insufficient privileges

https://docs.oracle.com/error-help/db/ora-01031/
01031. 00000 -  "insufficient privileges"
*Document: YES
*Cause:    A database operation was attempted without the required
           privilege(s).
*Action:   Ask your database administrator or security administrator to grant
           you the required privilege(s).

-- SYSユーザーでテーブル参照を試みる
SQL> SELECT * FROM hr.regions;

Error starting at line : 1 in command -
SELECT * FROM hr.regions
Error at Command Line : 1 Column : 18
Error report -
SQL Error: ORA-01031: insufficient privileges
Help: https://docs.oracle.com/error-help/db/ora-01031/
01031. 00000 -  "insufficient privileges"
*Document: YES
*Cause:    A database operation was attempted without the required
           privilege(s).
*Action:   Ask your database administrator or security administrator to grant
           you the required privilege(s).

More Details :
https://docs.oracle.com/error-help/db/ora-01031/
```

## HR/SALES_APPユーザーのアクセス確認

一方、レルム認可を行ったHRユーザーまたはSALES_APPユーザーからは、SYSユーザーではアクセスできなかったREGIONS表にアクセスできることを確認します。

```text
sql hr/Welcome1#Welcome1#@localhost:1521/freepdb1

SQL> sho user
USER is "HR"
SQL> SELECT * FROM hr.regions;

   REGION_ID REGION_NAME
____________ ______________
          10 Europe
          20 Americas
          30 Asia
          40 Oceania
          50 Africa
```

```text
[opc@db-tut ~]$ sql sales_app/Welcome1#Welcome1#@localhost:1521/freepdb1

SQL> sho user
USER is "SALES_APP"

SQL> SELECT * FROM hr.regions;

   REGION_ID REGION_NAME
____________ ______________
          10 Europe
          20 Americas
          30 Asia
          40 Oceania
          50 Africa
```

## APPユーザーのIPアドレス制限確認

APPユーザーにはIPアドレスによる制限付きで認可が付与されています。 この設定に基づき、許可されたIPアドレスからのみアクセス可能であることを確認します。

```text
-- 許可されたIPアドレスからアクセス
➜  ~ hostname -I
192.168.0.78
➜  ~ 159.13.59.170^C
➜  ~ sql app/Welcome1#Welcome1#@159.13.59.170:1521/freepdb1

SQL> sho user
USER is "APP"
SQL> SELECT SYS_CONTEXT('USERENV','IP_ADDRESS');

SYS_CONTEXT('USERENV','IP_ADDRESS')
___________________________________
159.13.49.55

SQL> SELECT * FROM hr.regions;

REGION_ID REGION_NAME
_________ ___________
       10 Europe
       20 Americas
       30 Asia
       40 Oceania
       50 Africa
```
```text
-- 許可されていないIPアドレスからアクセス
[opc@db-tut ~]$ hostname -I
10.0.0.209
[opc@db-tut ~]$ sql app/Welcome1#Welcome1#@localhost:1521/freepdb1

SQLcl: Release 25.4 Production on Fri Feb 13 04:12:08 2026

Copyright (c) 1982, 2026, Oracle.  All rights reserved.

Connected to:
Oracle AI Database 26ai Free Release 23.26.1.0.0 - Develop, Learn, and Run for Free
Version 23.26.1.0.0

SQL> SELECT SYS_CONTEXT('USERENV','IP_ADDRESS');

SYS_CONTEXT('USERENV','IP_ADDRESS')
______________________________________
127.0.0.1

SQL> SELECT * FROM hr.regions;

Error starting at line : 1 in command -
SELECT * FROM hr.regions
Error at Command Line : 1 Column : 18
Error report -
SQL Error: ORA-47306: 20000: DV_Error: Can only be accessed from a specific IP address

https://docs.oracle.com/error-help/db/ora-47306/47306. 00000 -  "%s: %s"
*Document: NO
*Cause:    When creating a Database Vault rule set, you can define your own
           error number or message to be raised when a rule set fails. The
           user-defined Oracle Database Vault rule set was set to FALSE.
*Action:   Review the associated rule set and make appropriate corrections if
           needed.

More Details :
https://docs.oracle.com/error-help/db/ora-47306/
```

エラーメッセージに、レルム認可時に設定したカスタムエラーメッセージが表示されていることも確認できます。