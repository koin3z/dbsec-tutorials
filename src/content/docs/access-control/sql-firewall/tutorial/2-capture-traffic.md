---
title: 2. SQLをキャプチャして学習する
description: 特定ユーザーのSQLトラフィックをキャプチャし、学習させます。
sidebar:
  order: 2
---

このページでは、特定ユーザー（例：SALES_APP）からのSQLトラフィックをキャプチャし、学習を行います。

> **実施内容**
> - SQLキャプチャの開始
> - 対象ユーザーでSQLを実行
> - キャプチャしたSQLの確認


## 2-1. SQLキャプチャの開始

SALES_APPユーザーからのSQLトラフィックのキャプチャを開始します。

```sql
BEGIN
  DBMS_SQL_FIREWALL.CREATE_CAPTURE (
    username         => 'SALES_APP',
    top_level_only   => TRUE,
    start_capture    => TRUE
  );
END;
/
```

## 2-2. 対象ユーザーでSQLを実行

SALES_APPユーザーに切り替えて適当な数のSQLを実行し、キャプチャをテストします。

```sql
-- 以下のSQLを実行
Select * From hr.job_history;
select job_id from hr.job_history;
desc hr.job_history;
Select first_name From hr.employees where employee_id IN(102,200);
select first_name, email, job_id from hr.employees where job_id like 'SA_%';

-- 意図的に失敗するSQLを実行する
select jfiros from aaiorwae;
```

## 2-3. キャプチャしたSQLの確認

SYSユーザーに切り替え、キャプチャを停止します。

```sql
EXEC DBMS_SQL_FIREWALL.STOP_CAPTURE('SALES_APP');
```

その後、キャプチャしたSQLを確認してみます。

```text
SQL> set markup csv on
SQL> SELECT USERNAME, COMMAND_TYPE, SQL_TEXT FROM DBA_SQL_FIREWALL_CAPTURE_LOGS;
"USERNAME" ,"COMMAND_TYPE","SQL_TEXT"
"SALES_APP","DESCRIBE"    ,"DESCRIBE HR.JOB_HISTORY"
"SALES_APP","SELECT"      ,"SELECT FIRST_NAME,EMAIL,JOB_ID FROM HR.EMPLOYEES WHERE JOB_ID LIKE :""SYS_B_0"""
"SALES_APP","SELECT"      ,"SELECT * FROM HR.JOB_HISTORY"
"SALES_APP","SELECT"      ,"SELECT FIRST_NAME FROM HR.EMPLOYEES WHERE EMPLOYEE_ID IN (:""SYS_B_0"",:""SYS_B_1"")"
"SALES_APP","SELECT"      ,"SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
"SALES_APP","SELECT"      ,"SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
"SALES_APP","SELECT"      ,"SELECT JOB_ID FROM HR.JOB_HISTORY"

7 rows selected.
```

最後の失敗したSQLを除き、正規化された形でキャプチャされていることが分かります。

また、`DBA_SQL_FIREWALL_CAPTURE_LOGS`には`SQL_SIGNATURE`列があり、ユニークなシグネチャを生成されていることも確認できます。

```text
SQL> SELECT SQL_SIGNATURE,  SQL_TEXT FROM DBA_SQL_FIREWALL_CAPTURE_LOGS;
"SQL_SIGNATURE"                                                   ,"SQL_TEXT"
"CE7BB58501B74B27A8E1839074BA3866D07C76F126DA7BC6C57B77DF6C55D4AC","DESCRIBE HR.JOB_HISTORY"
"68D80167ADB6D37A341214538593A79D192612A3261CD26E51201721028FFC47","SELECT FIRST_NAME,EMAIL,JOB_ID FROM HR.EMPLOYEES WHERE JOB_ID LIKE :""SYS_B_0"""
"D2955375D61F67FC60E03D3DD01FBD14A4FA0BEABC10610F5E3624575D07B119","SELECT * FROM HR.JOB_HISTORY"
"CE83846971309C2BD065492F7D870A0C980AB72022723B732E262DF160E1F14A","SELECT FIRST_NAME FROM HR.EMPLOYEES WHERE EMPLOYEE_ID IN (:""SYS_B_0"",:""SYS_B_1"")"
"8CD0E5550A8AF32553BDED7C77B8CC1FD103C51F438E11F1BC5F9CA315102794","SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
"8CD0E5550A8AF32553BDED7C77B8CC1FD103C51F438E11F1BC5F9CA315102794","SELECT DECODE (USER,:""SYS_B_0"",XS_SYS_CONTEXT (:""SYS_B_1"",:""SYS_B_2""),USER) FROM SYS.DUAL"
"C71BC97035DA56172F8F38C346D00906948E90E717ED309ADFD6B316BDD2101A","SELECT JOB_ID FROM HR.JOB_HISTORY"

7 rows selected.
```