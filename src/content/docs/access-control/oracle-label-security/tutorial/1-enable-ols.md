---
title: 1. Oracle Label Securityの準備
description: OLSの有効化・ポリシー作成・テーブル準備手順を解説します。
sidebar:
  order: 1
---

このページでは、Oracle Label Security (OLS) の有効化・ポリシー作成・テーブル準備手順を解説します。

## 実施内容
- 表の準備
- OLSの構成確認
- OLSの有効化
- ポリシーの作成と有効化

## 前提条件
- サンプルスキーマがインストールされていること
- サンプルユーザ SALES_APP が作成されていること

## 表の準備

JOB_HISTORY表をコピーし、ラベルを設定する表を `HR.JOB_HISTORY_4OLS` として別途用意します。

```sql
SQL> CREATE TABLE hr.job_history_4ols AS SELECT * FROM hr.job_history WHERE 1=0;
SQL> INSERT INTO hr.job_history_4ols SELECT * FROM hr.job_history;
```

作成した表を確認します。

```sql
SQL> select * from hr.job_history_4ols;

   EMPLOYEE_ID START_DATE    END_DATE     JOB_ID           DEPARTMENT_ID
______________ _____________ ____________ _____________ ________________
           102 13-JAN-11     24-JUL-16    IT_PROG                     60
           101 21-SEP-07     27-OCT-11    AC_ACCOUNT                 110
           101 28-OCT-11     15-MAR-15    AC_MGR                     110
           201 17-FEB-14     19-DEC-17    MK_REP                      20
           114 24-MAR-16     31-DEC-17    ST_CLERK                    50
           122 01-JAN-17     31-DEC-17    ST_CLERK                    50
           200 17-SEP-05     17-JUN-11    AD_ASST                     90
           176 24-MAR-16     31-DEC-16    SA_REP                      80
           176 01-JAN-17     31-DEC-17    SA_MAN                      80
           200 01-JUL-12     31-DEC-16    AC_ACCOUNT                  90

10 rows selected.
```

## OLSの構成確認

現在、OLSが構成されているかを確認します。確認には、DBA_SA_USER_PRIVSデータ・ディクショナリ・ビューを使用します。

```
SQL> SELECT * FROM DBA_OLS_STATUS;

NAME                    STATUS    DESCRIPTION
_______________________ _________ __________________________________
OLS_CONFIGURE_STATUS    FALSE     Determines if OLS is configured
OLS_ENABLE_STATUS       FALSE     Determines if OLS is enabled
```

ステータスの意味はそれぞれ以下になります。

- `OLS_CONFIGURE_STATUS`: Oracle Label Security が構成されているかどうかを判断します。
- `OLS_ENABLE_STATUS`: Oracle Label Security が有効化されているかどうかを判断します。

CDBから `CDB_OLS_STATUS` ビューを使用することで、CDB全体のOLS構成を確認することもできます。


```text title="[CDB] SYSユーザー"
SQL> SELECT * FROM CDB_OLS_STATUS;

NAME                    STATUS    DESCRIPTION                           CON_ID
_______________________ _________ __________________________________ _________
OLS_CONFIGURE_STATUS    FALSE     Determines if OLS is configured            1
OLS_ENABLE_STATUS       FALSE     Determines if OLS is enabled               1
OLS_CONFIGURE_STATUS    FALSE     Determines if OLS is configured            3
OLS_ENABLE_STATUS       FALSE     Determines if OLS is enabled               3
```

## OLSを有効化する

SYSユーザーでFREEPDB1にて以下を実行し、OLSを構成します。

```
-- ユーザー名とDBの確認
SQL> show user con_name
USER is "SYS"

CON_NAME
------------------------------
FREEPDB1

-- OLSを構成する
SQL> EXEC LBACSYS.CONFIGURE_OLS;

-- OLSを有効化する
SQL> EXEC LBACSYS.OLS_ENFORCEMENT.ENABLE_OLS;
```

再度 DBA_OLS_STATUS を確認し、2つの設定がTRUEになっていることを確認します。

```
SQL> SELECT * FROM DBA_OLS_STATUS;

NAME                    STATUS    DESCRIPTION
_______________________ _________ __________________________________
OLS_CONFIGURE_STATUS    TRUE      Determines if OLS is configured
OLS_ENABLE_STATUS       TRUE      Determines if OLS is enabled
```

設定を完全に反映させるため、FREEPDB1の再起動を行います。

```sql
-- CDBに移動
SQL> conn / as sysdba
Connected.
SQL> show user con_name
USER is "SYS"
CON_NAME
------------------------------
CDB$ROOT

-- 再起動
SQL> alter pluggable database freepdb1 close immediate;
SQL> alter pluggable database freepdb1 open;
```

## OLS設定に必要な権限の準備

OLSを操作するためのロール、LBAC_DBAロールを持っているユーザーを確認します。

```sql title="[PDB] SYSユーザー"
SQL> select * from dba_role_privs where granted_role = 'LBAC_DBA';

GRANTEE    GRANTED_ROLE    ADMIN_OPTION    DELEGATE_OPTION    DEFAULT_ROLE    COMMON    INHERITED
__________ _______________ _______________ __________________ _______________ _________ ____________
SYS        LBAC_DBA        YES             NO                 YES             YES       NO
LBACSYS    LBAC_DBA        YES             NO                 YES             YES       NO
```

今後のOLS操作をSYSユーザーで行う場合、SA_SYSDBAパッケージの実行に対して以下のエラーが発生するため、`INHERIT PRIVILEGES`権限が必要になります。
```
ORA-06598: insufficient INHERIT PRIVILEGES privilege
```

そのため、SYS ユーザーがLBACSYSの権限を継承できるよう、`INHERIT PRIVILEGES` を付与します。

```sql title="[PDB] SYSユーザー"
--- PDBに移動
alter session set container=freepdb1;

GRANT INHERIT PRIVILEGES ON USER SYS TO LBACSYS;
```

## OLSポリシーを作成し有効化する
OLSポリシー（またはポリシーコンテナ）を作成します。

```
BEGIN
  SA_SYSDBA.CREATE_POLICY (
    policy_name      => 'OLS_POL_DEMO',
    column_name      => 'OLS_LABEL_DEMO');
END;
/
```

`PL/SQL procedure successfully completed.` が表示され、無事実行されたことを確認します。

作成したポリシーを有効化します。
```
EXEC SA_SYSDBA.ENABLE_POLICY ('OLS_POL_DEMO');
```

これでOracle Label Securityの準備および設定は完了です。

