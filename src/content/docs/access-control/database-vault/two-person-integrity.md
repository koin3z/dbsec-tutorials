---
title: 二人制整合性
description: Database Vaultの二人制整合性（Two-Person Integrity）設定・体験手順を解説します。
sidebar:
  order: 11
---

このページでは、Oracle Database Vaultの二人制整合性（Two-Person Integrity）を使う方法を解説します。

## 前提条件
- Database Vaultが有効化されていること

## 概要

- 二人制整合性の概要
- ユーザー・ファンクション・ルール・ルールセット・コマンドルールの作成
- 動作確認

## ユーザーの作成

`TPI_BOSS`（マネージャ）、`TPI_USER`（作業者）という2人のDBユーザーを作成します。

Oracle Database Vault が有効化されている環境では、SYSユーザーでは直接ユーザーを作成できないため、 Database Vault を有効化する際に指定した、ユーザー管理用アカウント `C##ACCTMGR` を使用します。

```sql
sql c##dvacctmgr/<password>@localhost:1521/freepdb1

-- 2人のユーザーを作成
SQL> grant create session to tpi_boss identified by <password>;
SQL> grant create session to tpi_user identified by <password>;
```



## ファンクションの作成（is_boss_logged_in）

次に、DV_OWNERスキーマにTPI_BOSSがログインしているかを確認するファンクションを作成するため、SYSユーザーで権限を付与します。

```sql
-- sysユーザーに切り替え
SQL> conn sys/<password>@localhost:1521/freepdb1 as sysdba

SQL> grant create procedure to c##dvowner;
SQL> grant select on v_$session to c##dvowner;
```
なお、 `V$SESSION` は `V_$SESSION` のパブリックシノニムのため、権限は `V_$SESSION` で指定する必要があることに注意してください。  
次に TPI_BOSS がログインしているかを検証するファンクションを作成します。

```sql
-- C##DVOWNERユーザーでファンクション作成
CREATE OR REPLACE FUNCTION is_boss_logged_in
RETURN BOOLEAN AS
  v_boss_session NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_boss_session FROM v$session WHERE username = 'TPI_BOSS';

  -- TPI_BOSSユーザーがログインしていればTRUEを返す
  IF v_boss_session > 0 THEN
    RETURN TRUE; 
  ELSE
    RETURN FALSE;
  END IF;
END is_boss_logged_in;
/
```

無事実行され、`Function IS_BOSS_LOGGED_IN compiled` が表示されることを確認します。
続いて、作成したファンクションのEXECUTE権限をDVSYSスキーマに付与します。


```
-- C##DVOWNERユーザーで実行
SQL> GRANT EXECUTE ON is_boss_logged_in TO DVSYS;
```

注釈
  Database Vaultのオブジェクトおよびファンクションは、主にDVSYSスキーマに格納されています。（また、他にDVFスキーマがあります）
  そのため、2人制ルールを使用するに関わらず個別に作成したユーザー定義の関数を使用する際は、DVSYSスキーマへのEXECUTE権限が必要になることに注意してください。もちろんファンクションをDVSYSスキーマに作成することもできますが、このスキーマはデフォルトでロックされており、通常ロックしたままのスキーマ専用アカウントとして扱われます。
  （参考： [Oracle Database Vault DVSYSおよびDVFスキーマ](https://docs.oracle.com/cd/F82042_01/dvadm/introduction-to-oracle-database-vault.html#GUID-78C38076-42E7-463A-B111-214F6958A425) ）


## ルールの作成

作成したファンクションを指定し、ルールを作成します。

なお、このルールを作成する前に、dual表を用いて以下のように正しく条件判定が出来ているかを確認するといいと思います。


```sql
SQL> select SYS_CONTEXT('USERENV','SESSION_USER') = 'TPI_USER' AND C##DVOWNER.IS_BOSS_LOGGED_IN = TRUE from dual;

SYS_CONTEXT('USERENV','SESSION_USER')='TPI_USER'ANDC##DVOWNER.IS_BOSS_LOGGED_IN=TRUE
_______________________________________________________________________________________
false     
```

ルールを作成します。
```sql title="C##DVOWNERユーザーで実行"
BEGIN
  DBMS_MACADM.CREATE_RULE(
    rule_name => 'Rule to check tpi_Boss Login',
    rule_expr => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') = ''TPI_USER'' AND C##DVOWNER.IS_BOSS_LOGGED_IN = TRUE'
  );
END;
/
```

このままでは、Bossユーザー含め、誰もルールに適用しないため、どのユーザーもログインできません。  
そのため、TPI_USERユーザー以外はTPI_BOSSのログインがなくともログインできるようにルールを設定します。

```sql
BEGIN
  DBMS_MACADM.CREATE_RULE(
    rule_name => 'Rule to allow Other Users Access',
    rule_expr => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') != ''TPI_USER'' '
  );
END;
/
```

## ルール・セットの作成とルールの追加
ルール・セットを作成します。

```sql title="C##DVOWNERユーザーで実行"
BEGIN
  DBMS_MACADM.CREATE_RULE_SET(
    rule_set_name    => 'Ruleset for Dual Connect',
    description      => 'Ensures both the tpi_Boss and tpi_User are logged in before allowing access.',
    enabled          => DBMS_MACUTL.G_YES,                 -- (*)
    eval_options     => DBMS_MACUTL.G_RULESET_EVAL_ANY,    -- ルールセットのいずれかがTrueになることで有効化される
    fail_message     => 'DV_Error: Access restricted unless both tpi_Boss is logged in.',
    fail_code        => 20000,
    handler_options  => DBMS_MACUTL.G_RULESET_HANDLER_OFF, -- (*)
    handler          => '',
    is_static        => FALSE,                             -- (*)
    scope            => DBMS_MACUTL.G_SCOPE_LOCAL
  );
END;
/
```

作成したルール・セットにルールを追加します

```sql title="C##DVOWNERユーザーで実行"
BEGIN
  DBMS_MACADM.ADD_RULE_TO_RULE_SET(
    rule_set_name  => 'Ruleset for Dual Connect',
    rule_name      => 'Rule to check tpi_Boss Login',
    rule_order     => 1,
    enabled        => DBMS_MACUTL.G_YES     -- (*)
  );
END;
/

BEGIN
  DBMS_MACADM.ADD_RULE_TO_RULE_SET(
    rule_set_name  => 'Ruleset for Dual Connect',
    rule_name      => 'Rule to allow Other Users Access',
    rule_order     => 1,
    enabled        => DBMS_MACUTL.G_YES     -- (*)
  );
END;
/
```

## コマンド・ルールの作成

TPI_BOSSがログインしている場合のみ、TPI_USERがログインできるようにコマンド・ルールを作成します。

```sql title="C##DVOWNERユーザーで実行"
BEGIN
  DBMS_MACADM.CREATE_COMMAND_RULE(
    command          => 'CONNECT',
    rule_set_name    => 'Ruleset for Dual Connect',
    object_owner     => '%',
    object_name      => '%',
    enabled          => DBMS_MACUTL.G_YES
  );
END;
/

COMMIT;
```

## 二人制整合性を体験する

では、準備ができたのでTPI_USERが承認（TPI_BOSSのログイン）によって正しくログインできるかを確認します。

2つの端末を用意し、それぞれでTPI_USERとTPI_BOSSでログインします。

まず、TPI_USERユーザーでログインしようとするとできないことを確認します。


```shell title="端末A にて"
-- tpi_userで接続
➜  ~ sql tpi_user/Welcome1#Welcome1#@159.13.59.170:1521/freepdb1


SQLcl: Release 25.3 Production on Fri Feb 13 13:49:43 2026

Copyright (c) 1982, 2026, Oracle.  All rights reserved.

Connection failed
  USER          = tpi_user
  URL           = jdbc:oracle:thin:@159.13.59.170:1521/freepdb1
  Error Message = ORA-47306: 20000: DV_Error: Access restricted unless both tpi_Boss is logged in.

https://docs.oracle.com/error-help/db/ora-47306/

-- 他のユーザーではログインできる(以下はHRユーザーを作成している例)
➜  ~ sql hr/Welcome1#Welcome1#@159.13.59.170:1521/freepdb1


SQLcl: Release 25.3 Production on Fri Feb 13 13:50:11 2026

Copyright (c) 1982, 2026, Oracle.  All rights reserved.

Connected to:
Oracle AI Database 26ai Free Release 23.26.1.0.0 - Develop, Learn, and Run for Free
Version 23.26.1.0.0

SQL> sho user
USER is "HR"
SQL> exit
```

設定したエラーメッセージが表示され、ルールが正しく検知できていることが確認できます。

次に tpi_boss でログインし、その状態を維持します。

```shell title="端末B にて"
➜  ~ sql tpi_boss/Welcome1#Welcome1#@159.13.59.170:1521/freepdb1

SQL> sho user
USER is "TPI_BOSS"
```

再び端末Aにて、tpi_userユーザーでログインを行います。

```
➜  ~ sql tpi_user/Welcome1#Welcome1#@159.13.59.170:1521/FREEPDB1


SQLcl: Release 25.3 Production on Fri Feb 13 14:42:12 2026

Copyright (c) 1982, 2026, Oracle.  All rights reserved.

Connected to:
Oracle AI Database 26ai Free Release 23.26.1.0.0 - Develop, Learn, and Run for Free
Version 23.26.1.0.0

SQL> sho user
USER is "TPI_USER"
SQL>
```

この動作により、TPI_BOSSがログインしている間のみTPI_USERがログインできることが確認できました。

## 作成したオブジェクトの掃除
最後に作成したオブジェクトを削除します。

```sql title="c##dvacctmgrユーザーで実行"
DROP USER tpi_boss;
DROP USER tpi_user;
```

```sql title="SYSユーザーで実行"
REVOKE CREATE PROCEDURE FROM c##dvowner;
REVOKE SELECT ON V_$SESSION FROM c##dvowner;
```

```sql title="C##DVOWNERで実行"
DROP FUNCTION is_boss_logged_in;

EXEC DBMS_MACADM.DELETE_RULE_FROM_RULE_SET(rule_set_name => 'Ruleset for Dual Connect', rule_name => 'Rule to check tpi_Boss Login');
EXEC DBMS_MACADM.DELETE_RULE_FROM_RULE_SET(rule_set_name => 'Ruleset for Dual Connect', rule_name => 'Rule to allow Other Users Access');

EXEC DBMS_MACADM.DELETE_COMMAND_RULE(command => 'CONNECT', object_owner => '%', object_name => '%');
EXEC DBMS_MACADM.DELETE_RULE('Rule to check tpi_Boss Login');
EXEC DBMS_MACADM.DELETE_RULE('Rule to allow Other Users Access');

EXEC DBMS_MACADM.DELETE_RULE_SET('Ruleset for Dual Connect');

COMMIT;
```

以上で、二人制整合性を用いたセキュリティ設定の解説は終了です。
