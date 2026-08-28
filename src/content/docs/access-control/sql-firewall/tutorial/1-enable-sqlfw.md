---
title: 1. SQL Firewallの有効化
description: SQL Firewallの有効化手順を解説します。
sidebar:
  order: 1
---

このページでは、SQL Firewallの有効化手順を解説します。環境はFREEPDB1です。

> **実施内容**
> - SQL Firewallの有効化

## 1-1. SQL Firewallを有効化する

ステータスを確認します。

```sql
SQL> set markup csv on
SQL> select * from DBA_SQL_FIREWALL_STATUS;
"STATUS"  ,"STATUS_UPDATED_ON"                  ,"EXCLUDE_JOBS"
"DISABLED","06-DEC-24 05.50.51.263690 AM +00:00","Y"
```

DISABLEDとなっていれば無効化状態なので、次のコマンドで有効化します。

```sql
EXEC DBMS_SQL_FIREWALL.ENABLE;

-- 有効化されたことを確認
SQL> select * from DBA_SQL_FIREWALL_STATUS;
"STATUS" ,"STATUS_UPDATED_ON"                  ,"EXCLUDE_JOBS"
"ENABLED","06-DEC-24 05.52.21.098865 AM +00:00","Y"
```

ENABLEDとなっていれば有効化完了です。
