---
title: 2. OLSポリシーの準備
description: OLSのレベル・ラベル・ユーザーラベル・テーブル適用・データラベル設定手順を解説します。
sidebar:
  order: 2
---

このページでは、OLSのレベル・ラベル・ユーザーラベル・テーブル適用・データラベル設定手順を解説します。

## 実施内容
- レベルの作成
- ラベルの作成
- ユーザーラベルの作成
- 表にポリシーを適用
- データにラベルを適用

## レベルの作成

レベルはアクセス制御の範囲を定義するラベルの構成要素の1つです。
ラベルは「レベル」「区分」「グループ」の３つから構成されますが、ここでは必須となるレベルのみを作成します

```sql title="[PDB] SYSユーザー"
BEGIN
  SA_COMPONENTS.CREATE_LEVEL (
    policy_name => 'OLS_POL_DEMO',
    level_num   => 4000,
    short_name  => 'SENS',
    long_name   => 'SENSITIVE'
  );
  SA_COMPONENTS.CREATE_LEVEL (
    policy_name => 'OLS_POL_DEMO',
    level_num   => 3000,
    short_name  => 'CONF',
    long_name   => 'CONFIDENTIAL'
  );
  SA_COMPONENTS.CREATE_LEVEL (
    policy_name => 'OLS_POL_DEMO',
    level_num   => 2000,
    short_name  => 'INTL',
    long_name   => 'INTERNAL'
  );
END;
/
```

SA_COMPONENTS.CREATE_LEVELプロシージャについては [こちら](https://docs.oracle.com/cd/G11854_01/olsag/oracle-label-security-pl-sql-packages.html#GUID-C266B7C5-DAF4-4A97-B17F-AF39D286F17D) をご参照ください。

作成したレベルを確認します

```
SQL> select * from ALL_SA_LEVELS;

POLICY_NAME        LEVEL_NUM SHORT_NAME    LONG_NAME
_______________ ____________ _____________ _______________
OLS_POL_DEMO            3000 CONF          CONFIDENTIAL
OLS_POL_DEMO            2000 INTL          INTERNAL
OLS_POL_DEMO            4000 SENS          SENSITIVE
```

## データ・ラベルの作成

データに付与する具体的なラベルを作成します。 今回作成するラベルは先ほど作成したレベルしか用いませんので、先ほどのレベルと同じ内容のラベルを作成します。

```sql
BEGIN
  SA_LABEL_ADMIN.CREATE_LABEL (
    policy_name  => 'OLS_POL_DEMO',
    label_tag    => 400,
    label_value  => 'SENS',
    data_label   => TRUE
  );
  SA_LABEL_ADMIN.CREATE_LABEL (
    policy_name  => 'OLS_POL_DEMO',
    label_tag    => 300,
    label_value  => 'CONF',
    data_label   => TRUE
  );
  SA_LABEL_ADMIN.CREATE_LABEL (
    policy_name  => 'OLS_POL_DEMO',
    label_tag    => 200,
    label_value  => 'INTL',
    data_label   => TRUE
  );
END;
/
```

SA_LABEL_ADMIN.CREATE_LABELプロシージャについては [こちら](https://docs.oracle.com/cd/G11854_01/olsag/oracle-label-security-pl-sql-packages.html#GUID-6EE1DD6A-C893-4C01-88A9-C1AE36F224E3) をご参照ください。

作成されたラベルを確認します。

```
SQL> select * from ALL_SA_LABELS;

POLICY_NAME     LABEL       LABEL_TAG LABEL_TYPE
_______________ ________ ____________ __________________
OLS_POL_DEMO    SENS              400 USER/DATA LABEL
OLS_POL_DEMO    CONF              300 USER/DATA LABEL
OLS_POL_DEMO    INTL              200 USER/DATA LABEL
```

## ユーザー・ラベルの作成

各ユーザーに許可されるアクセス範囲（最大/最小レベル）を割り当てます。 割り当てるユーザーはHRユーザーとSALES_APPユーザーです。

```sql
BEGIN
  SA_USER_ADMIN.SET_LEVELS (
    policy_name  => 'OLS_POL_DEMO',
    user_name    => 'HR',
    max_level    => 'SENS',
    min_level    => 'INTL'
  );
  SA_USER_ADMIN.SET_LEVELS (
    policy_name  => 'OLS_POL_DEMO',
    user_name    => 'SALES_APP',
    max_level    => 'CONF',
    min_level    => 'INTL'
  );
END;
/
```

## 表にポリシーを適用する

作成したOLSポリシーをJOB_HISTORY_4OLS表に適用します。


```sql
BEGIN
  SA_POLICY_ADMIN.APPLY_TABLE_POLICY (
    policy_name    => 'OLS_POL_DEMO',
    schema_name    => 'HR',
    table_name     => 'JOB_HISTORY_4OLS',
    table_options  => 'READ_CONTROL'
  );
END;
/
```

READ_CONTROLを指定すると、ユーザーが後で実行するすべての問合せにポリシーが適用されます。  
ポリシーを適用すると、JOB_HISTORY_4OLS表にラベル用の列が追加されていることがわかります。

```text
SQL> desc hr.JOB_HISTORY_4OLS;

Name              Null?       Type
_________________ ___________ _______________
EMPLOYEE_ID       NOT NULL    NUMBER(6)
START_DATE        NOT NULL    DATE
END_DATE          NOT NULL    DATE
JOB_ID            NOT NULL    VARCHAR2(10)
DEPARTMENT_ID                 NUMBER(4)
OLS_LABEL_DEMO                NUMBER(10)
```

OLS_LABEL_DEMO列が追加され、NUMBER型であることが確認できます。

OLSポリシーでの制御を有効化します。

```sql
BEGIN
  SA_POLICY_ADMIN.ENABLE_TABLE_POLICY (
    policy_name => 'OLS_POL_DEMO',
    schema_name => 'HR',
    table_name  => 'JOB_HISTORY_4OLS'
  );
END;
/
```

## データにラベルを適用

以下を順に実行して、条件ごとにデータに適切なラベルを設定します。

JOB_IDがAC_MGRやSA_MANのレコードは SENSITIVE ラベルを設定します。

```sql
UPDATE HR.JOB_HISTORY_4OLS
  SET    OLS_LABEL_DEMO = CHAR_TO_LABEL('OLS_POL_DEMO','SENS')
  WHERE  JOB_ID LIKE '%_MGR' 
  OR     JOB_ID LIKE '%_MAN';
```

`2 rows updated.` されるのを確認します。

JOB_IDがAC_ACCOUNTとMK_REPのレコードに対しては `CONFIDENTIAL` ラベルを設定します。

```sql
UPDATE HR.JOB_HISTORY_4OLS
  SET    OLS_LABEL_DEMO = CHAR_TO_LABEL('OLS_POL_DEMO','CONF')
  WHERE  JOB_ID LIKE '%_ACCOUNT'
  OR     JOB_ID LIKE '%_REP';
```

`4 rows updated.` されるのを確認します。

IT_PROGまたはST_CLERK のレコードは `INTERNAL` ラベルを設定します。

```sql
UPDATE HR.JOB_HISTORY_4OLS
  SET    OLS_LABEL_DEMO = CHAR_TO_LABEL('OLS_POL_DEMO','INTL')
  WHERE  JOB_ID LIKE '%_PROG'
  OR     JOB_ID LIKE '%_CLERK'
  OR     JOB_ID LIKE '%_ASST';
```
`4 rows updated.` されるのを確認します。

最後にcommitをし、ラベルの設定を保存します。

```
SQL> commit;

Commit complete.
```

最後にラベルが正しく設定されたかを確認します。

```
SQL> select JOB_ID, OLS_LABEL_DEMO from HR.JOB_HISTORY_4OLS;

JOB_ID           OLS_LABEL_DEMO
_____________ _________________
IT_PROG                     200
AC_ACCOUNT                  300
AC_MGR                      400
MK_REP                      300
ST_CLERK                    200
ST_CLERK                    200
AD_ASST                     200
SA_REP                      300
SA_MAN                      400
AC_ACCOUNT                  300

10 rows selected.
```

以上でOracle Label Securityの動作確認は終了です。次の手順では構築したOLSの設定を削除していきます。

