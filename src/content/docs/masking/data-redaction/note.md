---
title: Data Redactionの注意点
description: Data Redactionの推測リスクや副問い合わせ時の挙動など注意点を解説します。
sidebar:
  order: 11
---

このページでは、Data Redactionの推測リスクや副問い合わせ時の挙動など注意点を解説します。

## Data Redactionはアクセス制御機能ではない

Data Redactionはデータの一部を隠すための機能であり、アクセス制御機能ではありません。Redactionを適用しても、特定条件下で推測が可能になる場合があるため、慎重な運用が求められます。

### WHERE句での推測例

```sql
-- HRユーザー
select first_name, salary, commission_pct from employees where salary > 10000;
-- → salary列の値がそのまま表示される

-- SALES_APPユーザー
select first_name, salary, commission_pct from hr.employees where salary > 10000;
-- → salary列の値が全て0で表示される
```

### 副問い合わせでの推測例

```sql
-- HRユーザー
select first_name, salary from employees where salary > (select avg(salary) from employees);
-- → salary列の値がそのまま表示される

-- SALES_APPユーザー
select first_name, salary from hr.employees where salary > (select avg(salary) from hr.employees);
-- → salary列の値が全て0で表示されるが、件数はHRユーザーと同じ
```

> Data Redactionはあくまでデータを隠すための機能であり、アクセス制御機能としてではないことに注意してください。
