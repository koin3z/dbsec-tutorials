---
title: 3. SQLの許可リストを作成する
description: キャプチャしたトラフィックをベースにSQLの許可リストを作成します。
sidebar:
  order: 3
---

> **実施内容**
> - 許可リストの確認
> - 許可リストの生成
> - 許可リストの有効化


## 3-1. 許可リストを作成する

現在の許可リストに登録されているSQLを確認します。

```sql
SQL> select ALLOWED_SQL_ID, SQL_TEXT from DBA_SQL_FIREWALL_ALLOWED_SQL;

no rows selected
```

初期状態では、許可リストは空です。

キャプチャしたSQLログを使用して、SQL許可リストを作成します。

```
EXEC DBMS_SQL_FIREWALL.GENERATE_ALLOW_LIST ('SALES_APP');
```

再度許可リストを確認し、SQLが登録されたことを確認します。

```sql
SQL> select ALLOWED_SQL_ID, SQL_TEXT from DBA_SQL_FIREWALL_ALLOWED_SQL;
"ALLOWED_SQL_ID","SQL_TEXT"
1               ,"SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
5               ,"SELECT FIRST_NAME FROM HR.EMPLOYEES WHERE EMPLOYEE_ID IN (:""SYS_B_0"",:""SYS_B_1"")"
2               ,"SELECT * FROM HR.JOB_HISTORY"
6               ,"SELECT FIRST_NAME,EMAIL,JOB_ID FROM HR.EMPLOYEES WHERE JOB_ID LIKE :""SYS_B_0"""
3               ,"DESCRIBE HR.JOB_HISTORY"
4               ,"SELECT JOB_ID FROM HR.JOB_HISTORY"

6 rows selected.
```


## 3-2. 許可リストを有効化する

作成した許可リストを有効化し、SALES_APPユーザーのSQLの実行を許可リストに基づいて制御します。

```sql
BEGIN
  DBMS_SQL_FIREWALL.ENABLE_ALLOW_LIST(
    username => 'SALES_APP',
    enforce  => DBMS_SQL_FIREWALL.ENFORCE_ALL,
    block    => TRUE
    );
END;
/
```

なお、SQL Firewallでは、blockオプションの設定に関係なく、一致しないデータベース接続またはSQL文の違反ログは常に生成されます。

次の手順で、許可リストが動作しているかの確認を行います。
