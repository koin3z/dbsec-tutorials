---
title: 2. VPDで列制御を行う
sidebar:
  order: 2
---

where句を使用すると行レベルでの制御になりますが、VPDでは列を制御することも可能です。 この手順では、Virtual Private Database (VPD)を使用して、特定の列へのアクセスを制御します。

## 実施内容

- VPD関数を作成する
- VPDポリシーを作成する
- HRユーザーで EMPLOYEES 表を確認
- SALES_APPユーザーで EMPLOYEES 表を確認し、VPDが正しく機能していることを確認
- 列を非表示ではなくNULL値で表示させる方法

---

## VPD関数の作成

列に対するフィルタ条件を定義するVPD関数を作成します。 この例では、SALARY 列をSALES_APPユーザーから非表示にします。

```sql
CREATE OR REPLACE FUNCTION hr.get_masking_salary_col(
  p_schema IN VARCHAR2,
  p_table  IN VARCHAR2
)
  RETURN VARCHAR2
  IS
    v_predicate VARCHAR2 (400);
  BEGIN
    IF SYS_CONTEXT('USERENV', 'SESSION_USER') = 'SALES_APP' THEN
      -- SALES_APPの場合、常にfalseで列を非表示にする
      v_predicate := '1=2'; 
    END IF;
  RETURN v_predicate;
END get_masking_salary_col;
/
```
実行し、`Function HR.GET_MASKING_SALARY_COL compiled` が表示されることを確認します。 ここでは `v_predicate := '1=2';` として、常にfalseを渡すことで、SALES_APPユーザーに対しては特定の列が非表示になるようにしています。

### VPDポリシーの作成

作成した関数を使用し、SALARY 列にポリシーを適用します。

```sql
BEGIN
  DBMS_RLS.ADD_POLICY (
    object_schema         => 'HR',
    object_name           => 'EMPLOYEES',
    policy_name           => 'employees_salary_col_vpd_policy',
    function_schema       => 'HR',
    policy_function       => 'get_masking_salary_col',
    sec_relevant_cols     => 'SALARY'
  );
END;
/
```
実行し、`PL/SQL procedure successfully completed.` が表示されることを確認します。

作成したVPDポリシーは `ALL_POLICIES` ビューで確認できます。

```text
SQL> select object_owner, object_name, policy_name, function, sel, ins, upd, del, idx, policy_type, common from all_policies where object_owner  = 'HR';

OBJECT_OWNER OBJECT_NAME POLICY_NAME                     FUNCTION               SEL INS UPD DEL IDX POLICY_TYPE COMMON
____________ ___________ _______________________________ ______________________ ___ ___ ___ ___ ___ ___________ ______
HR           EMPLOYEES   EMPLOYEES_VPD_POLICY            GET_SALES_PREDICATE    YES NO  YES YES NO  DYNAMIC     NO
HR           EMPLOYEES   EMPLOYEES_SALARY_COL_VPD_POLICY GET_MASKING_SALARY_COL YES NO  YES YES NO  DYNAMIC     NO
```

前手順で作成した `EMPLOYEES_VPD_POLICY` に加えてポリシーが作成されたことを確認します。


### HRユーザーで確認

作成したVPDポリシーが正しく機能しているかを確認します。 念のため、HRユーザーでアクセスし、salary列および107行すべてが表示されることを確かめます。

```text title="HRユーザー"
SQL> select first_name, salary from hr.employees;

FIRST_NAME  SALARY
___________ ______
Steven       24000
Neena        17000
Lex          17000
Alexander     9000
Bruce         6000
David         4800
Valli         4800
Diana         4200
Nancy        12008
Daniel        9000
John          8200
...
Hermann     10000
Shelley     12008
William      8300

107 rows selected.

SQL> select * from hr.employees;

EMPLOYEE_ID FIRST_NAME  LAST_NAME  EMAIL     PHONE_NUMBER   HIRE_DATE JOB_ID     SALARY COMMISSION_PCT MANAGER_ID DEPARTMENT_ID
___________ ___________ __________ _________ ______________ _________ __________ ______ ______________ __________ _____________
        100 Steven      King       SKING     1.515.555.0100 17-JUN-13 AD_PRES     24000                                      90
        101 Neena       Yang       NYANG     1.515.555.0101 21-SEP-15 AD_VP       17000                       100            90
        102 Lex         Garcia     LGARCIA   1.515.555.0102 13-JAN-11 AD_VP       17000                       100            90
        103 Alexander   James      AJAMES    1.590.555.0103 03-JAN-16 IT_PROG      9000                       102            60
        104 Bruce       Miller     BMILLER   1.590.555.0104 21-MAY-17 IT_PROG      6000                       103            60
        105 David       Williams   DWILLIAMS 1.590.555.0105 25-JUN-15 IT_PROG      4800                       103            60
        106 Valli       Jackson    VJACKSON  1.590.555.0106 05-FEB-16 IT_PROG      4800                       103            60
        107 Diana       Nguyen     DNGUYEN   1.590.555.0107 07-FEB-17 IT_PROG      4200                       103            60
        108 Nancy       Gruenberg  NGRUENBE  1.515.555.0108 17-AUG-12 FI_MGR      12008                       101           100
        109 Daniel      Faviet     DFAVIET   1.515.555.0109 16-AUG-12 FI_ACCOUNT   9000                       108           100
        110 John        Chen       JCHEN     1.515.555.0110 28-SEP-15 FI_ACCOUNT   8200                       108           100
 ...
        204 Hermann    Brown     HBROWN   1.515.555.0169 07-JUN-12 PR_REP      10000                       101            70
        205 Shelley    Higgins   SHIGGINS 1.515.555.0170 07-JUN-12 AC_MGR      12008                       101           110
        206 William    Gietz     WGIETZ   1.515.555.0171 07-JUN-12 AC_ACCOUNT   8300                       205           110

107 rows selected.
```



### SALES_APPユーザーで確認

SALES_APPユーザーでは、SALARY 列が含まれるクエリを実行すると、VPDによる制御が適用されます。

```text title="SALES_APPユーザー"
-- salary列を含むクエリ
SQL> select first_name, salary from hr.employees;

no rows selected

SQL> select * from hr.employees;

no rows selected

-- salary列を含まないクエリ
SQL> select first_name from hr.employees;

FIRST_NAME
___________
John
Karen
Alberto
Gerald
Eleni
Sean
David
Peter
...
Alyssa
Jonathon
Jack
Kimberely
Charles

35 rows selected.
```


## 列をNULL値で表示する方法（dbms_rls.ALL_ROWS）

VPDポリシーを作成する際、デフォルトでは対象列が選択された際にVPDが動作し、先ほどの結果のように値が条件を満たした行しか表示されませんが、`sec_relevant_cols_opt => dbms_rls.ALL_ROWS` を指定することで、列を非表示ではなくNULL値で表示することができます。

### ポリシーの削除と再作成

既存のVPDポリシーを削除し、新たに作成します。

```sql title="SYSTEMユーザー"
-- 既存のVPDポリシーを削除
BEGIN
  DBMS_RLS.DROP_POLICY(
    object_schema => 'HR',
    object_name   => 'EMPLOYEES',
    policy_name   => 'employees_salary_col_vpd_policy'
  );
END;
/
```
```sql title="SYSTEMユーザー"
-- VPDポリシーを再作成
BEGIN
  DBMS_RLS.ADD_POLICY (
    object_schema         => 'HR',
    object_name           => 'EMPLOYEES',
    policy_name           => 'employees_salary_col_vpd_policy',
    function_schema       => 'HR',
    policy_function       => 'get_masking_salary_col',
    sec_relevant_cols     => 'SALARY',
    sec_relevant_cols_opt => dbms_rls.ALL_ROWS
  );
END;
/
```

### SALES_APPユーザーで確認する

 ポリシー再作成後、再びSALES_APPユーザーで確認します。SALARY 列がNULL値として表示されます。

```text
SQL> select first_name, salary from hr.employees;

FIRST_NAME  SALARY
___________ ______
John
Karen
Alberto
Gerald
Eleni
Sean
David
Peter
Christopher
Nanette
Oliver
...
Alyssa
Jonathon
Jack
Kimberely
Charles

35 rows selected.


SQL> select * from hr.employees;

EMPLOYEE_ID FIRST_NAME  LAST_NAME EMAIL    PHONE_NUMBER   HIRE_DATE JOB_ID SALARY COMMISSION_PCT MANAGER_ID DEPARTMENT_ID
___________ ___________ _________ ________ ______________ _________ ______ ______ ______________ __________ _____________
        145 John        Singh     JSINGH   44.1632.960000 01-OCT-14 SA_MAN                   0.4        100            80
        146 Karen       Partners  KPARTNER 44.1632.960001 05-JAN-15 SA_MAN                   0.3        100            80
        147 Alberto     Errazuriz AERRAZUR 44.1632.960002 10-MAR-15 SA_MAN                   0.3        100            80
        148 Gerald      Cambrault GCAMBRAU 44.1632.960003 15-OCT-17 SA_MAN                   0.3        100            80
        149 Eleni       Zlotkey   EZLOTKEY 44.1632.960004 29-JAN-18 SA_MAN                   0.2        100            80
        150 Sean        Tucker    STUCKER  44.1632.960005 30-JAN-15 SA_REP                   0.3        145            80
        151 David       Bernstein DBERNSTE 44.1632.960006 24-MAR-15 SA_REP                  0.25        145            80
        152 Peter       Hall      PHALL    44.1632.960007 20-AUG-15 SA_REP                  0.25        145            80
        153 Christopher Olsen     COLSEN   44.1632.960008 30-MAR-16 SA_REP                   0.2        145            80
        154 Nanette     Cambrault NCAMBRAU 44.1632.960009 09-DEC-16 SA_REP                   0.2        145            80
        155 Oliver      Tuvault   OTUVAULT 44.1632.960010 23-NOV-17 SA_REP                  0.15        145            80
        156 Janette     King      JKING    44.1632.960011 30-JAN-14 SA_REP                  0.35        146            80
        157 Patrick     Sully     PSULLY   44.1632.960012 04-MAR-14 SA_REP                  0.35        146            80
...
        172 Elizabeth  Bates      EBATES   44.1632.960027 24-MAR-17 SA_REP                  0.15        148            80
        173 Sundita    Kumar      SKUMAR   44.1632.960028 21-APR-18 SA_REP                   0.1        148            80
        174 Ellen      Abel       EABEL    44.1632.960029 11-MAY-14 SA_REP                   0.3        149            80
        175 Alyssa     Hutton     AHUTTON  44.1632.960030 19-MAR-15 SA_REP                  0.25        149            80
        176 Jonathon   Taylor     JTAYLOR  44.1632.960031 24-MAR-16 SA_REP                   0.2        149            80
        177 Jack       Livingston JLIVINGS 44.1632.960032 23-APR-16 SA_REP                   0.2        149            80
        178 Kimberely  Grant      KGRANT   44.1632.960033 24-MAY-17 SA_REP                  0.15        149
        179 Charles    Johnson    CJOHNSON 44.1632.960034 04-JAN-18 SA_REP                   0.1        149            80

35 rows selected.
```

このように、salary列はNULLになっていますが、SALES_APPユーザーでも他の列は通常どおり表示されていることがわかります。


以上でOracle Label Securityの動作確認は終了です。次の手順では構築したOLSの設定を削除していきます。

