---
title: 3. VPDの設定を削除する
sidebar:
  order: 3
---

この手順では、VPDデモで作成した関数およびポリシーを削除し、競合を防ぐために設定をクリアします。

## 実施内容

- VPD関数の削除
- VPDポリシーの削除
- 削除結果の確認


## VPD関数の削除

以下のSQLを使用して、HRスキーマ内に作成された関数を確認します。

```text
SQL> select object_name from all_objects where owner = 'HR' and object_type = 'FUNCTION';

OBJECT_NAME
______________________
GET_SALES_PREDICATE
GET_MASKING_SALARY_COL
```

確認した関数を削除します。

```text
SQL> drop function hr.get_sales_predicate;
SQL> drop function hr.get_masking_salary_col;
```

再度関数を確認し、すべて削除されたことを確認します


```text
SQL> select object_name from all_objects where owner = 'HR' and object_type = 'FUNCTION';

no rows selected
```

## VPDポリシーの削除

現在、作成されているポリシーを確認します。

```text
SQL> select policy_name from all_policies where object_owner = 'HR';

POLICY_NAME
_______________________________
EMPLOYEES_SALARY_COL_VPD_POLICY
EMPLOYEES_VPD_POLICY
```

確認したポリシーを削除します。

```sql
-- 行制御ポリシーを削除
BEGIN
  DBMS_RLS.DROP_POLICY(
    object_schema => 'HR',
    object_name   => 'EMPLOYEES',
    policy_name   => 'employees_vpd_policy'
  );
END;
/

-- 列制御ポリシーを削除
BEGIN
  DBMS_RLS.DROP_POLICY(
    object_schema => 'HR',
    object_name   => 'EMPLOYEES',
    policy_name   => 'employees_salary_col_vpd_policy'
  );
END;
/
```

ポリシーが削除されたことを確認します。

```text
SQL> select policy_name from all_policies where object_owner = 'HR';

no rows selected
```

以上でVPDのデモは終了です。
