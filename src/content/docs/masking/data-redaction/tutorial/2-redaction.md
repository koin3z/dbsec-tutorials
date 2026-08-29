---
title: 2. Redactionを体験する
description: HRユーザーとSALES_APPユーザーでの実行結果の違いを確認します。
sidebar:
  order: 2
---

このページでは、HRユーザーとSALES_APPユーザーでの実行結果の違いを確認します。

## 実施内容
- HRユーザーで接続しデータ取得
- SALES_APPユーザーで接続しデータ取得

### HRユーザーで接続

まず、HRユーザーとしてデータベースに接続し、 EMPLOYEES テーブルの first_name 、 salary 、 commission_pct 列を取得します。（実行結果は一部を抜粋しています）
```text
$ sql hr/<password>@localhost:1521/freepdb1

SQL> show con_name user
CON_NAME
------------------------------
FREEPDB1
USER is "HR"

-- salary列とcommission_pct列のデータがそのまま表示される
select first_name, salary, commission_pct from hr.employees;

SQL> exit
```

```
SQL> select first_name, salary, commission_pct from hr.employees;

FIRST_NAME        SALARY    COMMISSION_PCT
______________ _________ _________________
Steven             24000
Neena              17000
Lex                17000
Alexander           9000
Bruce               6000
David               4800
Valli               4800
...
Peter               2500
John               14000               0.4
Karen              13500               0.3
Alberto            12000               0.3
Gerald             11000               0.3
Eleni              10500               0.2
Sean               10000               0.3
David               9500              0.25
Peter               9000              0.25
Christopher         8000               0.2
Nanette             7500               0.2
Oliver              7000              0.15
Janette            10000              0.35
Patrick             9500              0.35
Allan               9000              0.35
Lindsey             8000               0.3
...
Susan              6500
Hermann           10000
Shelley           12008
William            8300

107 rows selected.
```

salary 列と commission_pct 列のデータがそのまま表示され、HR ユーザーは元のデータにアクセスできていることがわかります。

### SALES_APPユーザーで接続

次に、SALES_APPユーザーとしてデータベースに接続し、同じクエリを実行します。
このユーザーにはリダクションポリシーが適用されているため、マスキングされたデータが返るはずです。

```sql
$ sqlplus sales_app/<password>@localhost:1521/freepdb1
select first_name, salary, commission_pct from hr.employees;
-- salary列とcommission_pct列の値が全て0で表示される
```
```
sql sales_app/Welcome1#Welcome1#@localhost:1521/freepdb1

SQL> show con_name user
CON_NAME
------------------------------
FREEPDB1
USER is "SALES_APP"

SQL> select first_name, salary, commission_pct from hr.employees;

FIRST_NAME        SALARY    COMMISSION_PCT
______________ _________ _________________
Steven                 0
Neena                  0
Lex                    0
Alexander              0
Bruce                  0
David                  0
Valli                  0
...
Peter                  0
John                   0                 0
Karen                  0                 0
Alberto                0                 0
Gerald                 0                 0
Eleni                  0                 0
Sean                   0                 0
David                  0                 0
Peter                  0                 0
Christopher            0                 0
Nanette                0                 0
Oliver                 0                 0
Janette                0                 0
Patrick                0                 0
Allan                  0                 0
Lindsey                0                 0
...
Susan                 0
Hermann               0
Shelley               0
William               0

107 rows selected.
```


SALES_APPユーザーでは、 salary 列と commission_pct 列の値が全て 0 で表示されており、リダクションポリシーが正しく適用されていることが確認できます。
これにより、SALES_APPユーザーは給与や手数料の値を閲覧することができなくなっています。

最後に作成したRedactionポリシーを削除します。

## Redactionポリシーの削除

```sql
BEGIN
  DBMS_REDACT.DROP_POLICY (
    object_schema  => 'HR',
    object_name    => 'EMPLOYEES',
    policy_name    => 'POL_REDCT_EMPLOYEES_SALARY'
  );
END;
/
```

```text
SQL> SELECT * FROM redaction_policies;

no rows selected
SQL> SELECT object_owner, object_name, column_name, function_type FROM redaction_columns;

no rows selected
```

以上で、Dara Redaction は終了です。