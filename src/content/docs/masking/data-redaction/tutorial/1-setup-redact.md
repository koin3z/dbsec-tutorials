---
title: 1. Data Redactionの準備
description: Data Redactionの比較用ユーザー作成とリダクションポリシー作成手順を解説します。
sidebar:
  order: 1
---

このページでは、Data Redactionの比較用ユーザー（SALES_APP）作成とリダクションポリシー作成手順を解説します。

## 前提条件
- サンプルスキーマを準備していること
- SALES_APPユーザーを作成していること

## 実施内容
- リダクションポリシー作成

## リダクションポリシー作成

SALES_APP ユーザーには EMPLOYEES テーブルの `SALARY` 列と `COMMISSION_PCT` 列をマスキングするポリシーを作成します。
営業が使用するアプリケーションでは給与と手数料の値は使用しないため閲覧は必要ない、という架空の設定です。
一度に一つの列にしかリダクションポリシーを適用できないため、 `SALARY` 列と `COMMISSION_PCT` 列に別々にポリシーを適用します。

まず、`SALARY` 列に対してリダクションポリシーを作成します。以下のコマンドを実行します

```sql
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'HR',
    object_name         => 'EMPLOYEES',
    column_name         => 'SALARY',
    policy_name         => 'POL_REDCT_EMPLOYEES_SALARY',
    function_type       => DBMS_REDACT.FULL,
    expression          => 'SYS_CONTEXT(''USERENV'', ''SESSION_USER'') = ''SALES_APP'''
  );
END;
/
```

次に、先に作成した POL_REDCT_EMPLOYEES_SALARY ポリシーに新たに列を追加する形で `COMMISSION_PCT` 列に対してリダクションポリシーを追加します。

注意、表は１つのポリシーしか持つことができません。
> ORA-28069: このオブジェクトには、すでにデータ・リダクション・ポリシーが存在します。
> 原因: このオブジェクトには、すでにデータ・リダクション・ポリシーが存在します。
> 処置: リダクション・ポリシーが定義済ではない表またはビューを指定するか、DBMS_REDACT.ALTER_POLICYを使用してこのオブジェクトの既存のリダクション・ポリシーを変更します。
> https://docs.oracle.com/cd/F19136_01/errmg/ORA-24280.html

```sql
BEGIN
  DBMS_REDACT.ALTER_POLICY(
    object_schema  => 'HR',
    object_name    => 'EMPLOYEES',
    column_name    => 'COMMISSION_PCT',
    policy_name    => 'POL_REDCT_EMPLOYEES_SALARY',
    function_type  => DBMS_REDACT.FULL
  );
END;
/
```

上記２つのリダクションポリシーが正常に作成されたかを確認します。

```sql
SELECT * FROM redaction_policies;
SELECT object_owner, object_name, column_name, function_type FROM redaction_columns;
```

```text
SQL> SELECT * FROM redaction_policies;

OBJECT_OWNER OBJECT_NAME POLICY_NAME                EXPRESSION                                           ENABLE POLICY_DESCRIPTION
____________ ___________ __________________________ ____________________________________________________ ______ __________________
HR           EMPLOYEES   POL_REDCT_EMPLOYEES_SALARY SYS_CONTEXT('USERENV', 'SESSION_USER') = 'SALES_APP' YES            

SQL> SELECT object_owner, object_name, column_name, function_type FROM redaction_columns;

OBJECT_OWNER OBJECT_NAME COLUMN_NAME    FUNCTION_TYPE
____________ ___________ ______________ ______________
HR           EMPLOYEES   SALARY         FULL REDACTION
HR           EMPLOYEES   COMMISSION_PCT FULL REDACTION
```

これでSALES_APPユーザーがEMPLOYEESテーブルのSALARY列とCOMMISSION_PCT列へのアクセス時にリダクションが適用されます。


## 参考リンク

https://docs.oracle.com/cd/G47991_01/arpls/DBMS_REDACT.html