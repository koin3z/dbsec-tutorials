---
title: 4. 動作を確認する
sidebar:
  order: 4
---

SQL Firewallの動作を確認し、許可リストに基づくSQLの許可・ブロックの動作や違反ログの確認、許可リストの編集を行います。

> **実施内容**
> - 許可リストの確認
> - SQLの実行とブロックの確認
> - 違反ログの確認
> - 許可リストからの削除操作

## 4-1. 許可リストの確認

現在の許可リストを確認し、登録されているSQLを把握します。

```sql
SQL> select ALLOWED_SQL_ID, SQL_TEXT from DBA_SQL_FIREWALL_ALLOWED_SQL;
"ALLOWED_SQL_ID","SQL_TEXT"
1               ,"SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
5               ,"SELECT FIRST_NAME FROM HR.EMPLOYEES WHERE EMPLOYEE_ID IN (:""SYS_B_0"",:""SYS_B_1"")"
2               ,"SELECT * FROM HR.JOB_HISTORY"
6               ,"SELECT FIRST_NAME,EMAIL,JOB_ID FROM HR.EMPLOYEES WHERE JOB_ID LIKE :""SYS_B_0"""
3               ,"DESCRIBE HR.JOB_HISTORY"
4               ,"SELECT JOB_ID FROM HR.JOB_HISTORY"
```


## 4-2. SQLの実行とブロックの確認

SALES_APPユーザーで接続し、許可リストに含まれるSQLを実行して成功することを確認します。

```sql
SQL> SELECT JOB_ID FROM HR.JOB_HISTORY;

JOB_ID
----------
AC_ACCOUNT
AC_ACCOUNT
...

SQL> DESCRIBE HR.JOB_HISTORY
Name                                      Null?    Type
----------------------------------------- -------- ----------------------------
EMPLOYEE_ID                               NOT NULL NUMBER(6)
START_DATE                                NOT NULL DATE
END_DATE                                  NOT NULL DATE
JOB_ID                                    NOT NULL VARCHAR2(10)
DEPARTMENT_ID                                      NUMBER(4)
```

次に許可リストにないSQLを実行します。

```sql
SQL> SELECT JOB_ID, EMPLOYEE_ID FROM HR.JOB_HISTORY;
SELECT JOB_ID, EMPLOYEE_ID FROM HR.JOB_HISTORY
                                *
ERROR at line 1:
ORA-47605: SQL Firewall violation
Help: https://docs.oracle.com/error-help/db/ora-47605/
```

このように許可リストにないSQLは「SQL Firewall violation」エラーにてブロックされることがわかります。


## 4-3. 違反ログを確認

違反ログを確認します。

```sql
SQL> set markup csv on
SQL> select USERNAME, SQL_TEXT, IP_ADDRESS, CLIENT_PROGRAM, OS_USER from DBA_SQL_FIREWALL_VIOLATIONS;
"USERNAME" ,"SQL_TEXT"                                     ,"IP_ADDRESS","CLIENT_PROGRAM"               ,"OS_USER"
"SALES_APP","SELECT JOB_ID,EMPLOYEE_ID FROM HR.JOB_HISTORY","127.0.0.1" ,"sqlplus@db-vm23ai (TNS V1-V3)","oracle"
```

先ほどブロックされたSQLが記録されていることが分かります。

## 4-4. 許可リストから許可SQLを削除する

SQL許可リストを確認し、IDを取得します。

```sql
SQL> select ALLOWED_SQL_ID,SQL_TEXT from DBA_SQL_FIREWALL_ALLOWED_SQL;
"ALLOWED_SQL_ID","SQL_TEXT"
1               ,"SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
5               ,"SELECT FIRST_NAME FROM HR.EMPLOYEES WHERE EMPLOYEE_ID IN (:""SYS_B_0"",:""SYS_B_1"")"
2               ,"SELECT * FROM HR.JOB_HISTORY"
6               ,"SELECT FIRST_NAME,EMAIL,JOB_ID FROM HR.EMPLOYEES WHERE JOB_ID LIKE :""SYS_B_0"""
3               ,"DESCRIBE HR.JOB_HISTORY"
4               ,"SELECT JOB_ID FROM HR.JOB_HISTORY"

6 rows selected.
```

ここでは `3` を指定し、JOB_HISTORY表のメタデータを見れないようにします。

指定したSQLを許可リストから削除します。

```sql
BEGIN
  DBMS_SQL_FIREWALL.DELETE_ALLOWED_SQL (
    username       => 'SALES_APP',
    allowed_sql_id => 3
    );
END;
/
```

指定したSQLが許可リストから削除され、実行できなくなっていることが分かります。

```sql
SQL> select ALLOWED_SQL_ID,SQL_TEXT from DBA_SQL_FIREWALL_ALLOWED_SQL;
"ALLOWED_SQL_ID","SQL_TEXT"
1               ,"SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
5               ,"SELECT FIRST_NAME FROM HR.EMPLOYEES WHERE EMPLOYEE_ID IN (:""SYS_B_0"",:""SYS_B_1"")"
2               ,"SELECT * FROM HR.JOB_HISTORY"
6               ,"SELECT FIRST_NAME,EMAIL,JOB_ID FROM HR.EMPLOYEES WHERE JOB_ID LIKE :""SYS_B_0"""
4               ,"SELECT JOB_ID FROM HR.JOB_HISTORY"
```

```sql
-- SALES_APPユーザーで実行
SQL> DESCRIBE HR.JOB_HISTORY
ERROR:
ORA-47605: SQL Firewall violation
```

以上でSQL Firewallのデモは終了です。
