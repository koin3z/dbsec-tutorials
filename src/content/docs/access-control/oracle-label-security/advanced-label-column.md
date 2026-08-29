---
title: ラベルデータとラベル列の扱い
description: データラベルを使った操作やラベル列の非表示オプションの適用方法を解説します。
sidebar:
  order: 11
---

このページでは、データラベルを使用した操作（絞り込み・ソート）と、ラベル列の非表示オプションを適用する方法を解説します。

## 前提条件
- Tutorial3まで手順が終わっていること

## 実施内容
- データラベルの表示
- ラベル列の非表示設定

## データラベルの表示

見ていただくとわかる通りですが、ラベル列は数値として管理されるため、不等号を使用した条件で絞り込みが可能です。

```text
SQL> select JOB_ID, OLS_LABEL_DEMO from HR.JOB_HISTORY_4OLS where OLS_LABEL_DEMO >= 300;

JOB_ID           OLS_LABEL_DEMO
_____________ _________________
AC_ACCOUNT                  300
MK_REP                      300
SA_REP                      300
AC_ACCOUNT                  300
```

ラベル列を基準にORDER BYでデータをソートすることも可能です。

```text
SQL> select JOB_ID, OLS_LABEL_DEMO from HR.JOB_HISTORY_4OLS order by OLS_LABEL_DEMO;

JOB_ID           OLS_LABEL_DEMO
_____________ _________________
IT_PROG                     200
ST_CLERK                    200
AD_ASST                     200
ST_CLERK                    200
SA_REP                      300
AC_ACCOUNT                  300
MK_REP                      300
AC_ACCOUNT                  300

8 rows selected.
```

## ラベル列の非表示設定

HIDEオプションを表に適用することで、ポリシーを表す列を非表示にするように選択できます。
しかし、この非表示設定は初回のポリシー適用時のみ可能ですので、すでにポリシーがある場合は一度ポリシーを削除する必要があります。

以下のSQLでポリシーを削除し、OLS_LABEL_DEMO列を表から削除します。

```sql
BEGIN
  SA_POLICY_ADMIN.REMOVE_TABLE_POLICY (
    policy_name     => 'OLS_POL_DEMO',
    schema_name     => 'HR',
    table_name      => 'JOB_HISTORY_4OLS',
    drop_column     => TRUE
  );
END;
/
```
ラベル列が削除されたことを確認します
```
SQL> desc HR.JOB_HISTORY_4OLS;

Name             Null?       Type
________________ ___________ _______________
EMPLOYEE_ID      NOT NULL    NUMBER(6)
START_DATE       NOT NULL    DATE
END_DATE         NOT NULL    DATE
JOB_ID           NOT NULL    VARCHAR2(10)
DEPARTMENT_ID                NUMBER(4)
```

HIDEオプションを使用してポリシーを再適用します。

```sql
BEGIN
  SA_POLICY_ADMIN.APPLY_TABLE_POLICY (
    policy_name    => 'OLS_POL_DEMO',
    schema_name    => 'HR', 
    table_name     => 'JOB_HISTORY_4OLS',
    table_options  => 'READ_CONTROL, HIDE'
  );
END;
/
```

ポリシーの適用後、ラベル列は非表示になっていることが分かります。

```
SQL> desc HR.JOB_HISTORY_4OLS;

Name             Null?       Type
________________ ___________ _______________
EMPLOYEE_ID      NOT NULL    NUMBER(6)
START_DATE       NOT NULL    DATE
END_DATE         NOT NULL    DATE
JOB_ID           NOT NULL    VARCHAR2(10)
DEPARTMENT_ID                NUMBER(4)

SQL> select * from HR.JOB_HISTORY_4OLS;

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

非表示設定でも、明示的に列名を指定すればラベル列を参照することができます。  
（ここでは一度ポリシーを削除したため、再適用後のラベル列のデータは空になっています。）

```
SQL> select JOB_ID, OLS_LABEL_DEMO from HR.JOB_HISTORY_4OLS;

JOB_ID           OLS_LABEL_DEMO
_____________ _________________
IT_PROG
AC_ACCOUNT
AC_MGR
MK_REP
ST_CLERK
ST_CLERK
AD_ASST
SA_REP
SA_MAN
AC_ACCOUNT

10 rows selected.
```

手順2と同様のデータ挿入手順でラベルデータを挿入し直すと、ラベル列のデータも確認できることが分かります。

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

SQL> desc HR.JOB_HISTORY_4OLS;

Name             Null?       Type
________________ ___________ _______________
EMPLOYEE_ID      NOT NULL    NUMBER(6)
START_DATE       NOT NULL    DATE
END_DATE         NOT NULL    DATE
JOB_ID           NOT NULL    VARCHAR2(10)
DEPARTMENT_ID                NUMBER(4)
```

以上でOracle Label Securityの動作確認は終了です。チュートリアルの手順４にて構築したOLSの設定を削除します。

