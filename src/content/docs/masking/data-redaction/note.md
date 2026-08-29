---
title: Data Redactionの注意点
description: Data Redactionの推測リスクや副問い合わせ時の挙動など注意点を解説します。
sidebar:
  order: 11
---

このページでは、Data Redactionの推測リスクや副問い合わせ時の挙動など注意点を解説します。

## Data Redactionはアクセス制御機能ではない

Data Redactionはデータの一部を隠すための機能であり、アクセス制御機能ではありません。Redactionを適用しても、特定の条件下で元の値を推測できる場合があるため、慎重な運用が求められます。

### WHERE句での推測例

リダクション対象の `salary` 列に対して `WHERE` 句を用いた例です。同じ条件のクエリを `HR` ユーザーと `SALES_APP` ユーザーでそれぞれ実行します。

**HRユーザーが実行した場合**（`salary` 列はそのまま表示される）:

```text
SQL> show user
USER is "HR"
SQL> set pages 500
SQL> select first_name, salary, commission_pct from employees where salary > 10000;

FIRST_NAME               SALARY COMMISSION_PCT
-------------------- ---------- --------------
Steven                    24000
Neena                     17000
Lex                       17000
Nancy                     12008
Den                       11000
John                      14000             .4
Karen                     13500             .3
Alberto                   12000             .3
Gerald                    11000             .3
Eleni                     10500             .2
Clara                     10500            .25
Lisa                      11500            .25
Ellen                     11000             .3
Michael                   13000
Shelley                   12008

15 rows selected.
```

**SALES_APPユーザーが同じクエリを実行した場合**（`salary` 列は全て `0` にリダクションされる）:

```text
SQL> show user
USER is "SALES_APP"
SQL> set pages 500
SQL> select first_name, salary, commission_pct from hr.employees where salary > 10000;

FIRST_NAME               SALARY COMMISSION_PCT
-------------------- ---------- --------------
Steven                        0
Neena                         0
Lex                           0
Nancy                         0
Den                           0
John                          0              0
Karen                         0              0
Alberto                       0              0
Gerald                        0              0
Eleni                         0              0
Clara                         0              0
Lisa                          0              0
Ellen                         0              0
Michael                       0
Shelley                       0

15 rows selected.
```

`SALES_APP` ユーザーでは `salary` 列が全て `0` にリダクションされていますが、返される行は `HR` ユーザーとまったく同じです。`WHERE salary > 10000` という条件は元の値に対して評価されるため、`BETWEEN` 句などで範囲を絞り込むことで、リダクションされた値でも元の値を推測できてしまいます。

### 副問い合わせでの推測例

副問い合わせを含む SQL 文でも同様の注意が必要です。以下は `salary` 列の平均を求める副問い合わせを使った例です。

**HRユーザーの場合**:

```text
SQL> select first_name, salary from employees where salary > (select avg(salary) from employees);

FIRST_NAME               SALARY
-------------------- ----------
Steven                    24000
Neena                     17000
Lex                       17000
Alexander                  9000
Nancy                     12008
Daniel                     9000
...
Jack                       8400
Kimberely                  7000
Michael                   13000
Susan                      6500
Hermann                   10000
Shelley                   12008
William                    8300

51 rows selected.
```

**SALES_APPユーザーの場合**:

```text
SQL> select first_name, salary from hr.employees where salary > (select avg(salary) from hr.employees);

FIRST_NAME               SALARY
-------------------- ----------
Steven                        0
Neena                         0
Lex                           0
Alexander                     0
Nancy                         0
Daniel                        0
...
Jack                          0
Kimberely                     0
Michael                       0
Susan                         0
Hermann                       0
Shelley                       0
William                       0

51 rows selected.
```

`SALES_APP` ユーザーの結果では `salary` 列が全て `0` にリダクションされているにもかかわらず、副問い合わせ（平均値の計算）は元の値に対して実行されるため、返される行数・行の内容は `HR` ユーザーと同じ 51 行になります。リダクション後の値は副問い合わせに反映されない点に注意してください。

> Data Redactionはあくまでデータを隠すための機能であり、アクセス制御機能としてではないことに注意してください。
