---
title: クライアント識別子を用いた制御
sidebar:
  order: 11
---

クライアント識別子やアプリケーション・コンテキストをアプリケーションから指定することで、同じDBユーザでも異なるwhere句を追加することができます。 ここで示すデモ手順では、クライアント識別子を設定することで、同じデータベースユーザーでも異なる行を表示させる制御を行います。

## 実施内容

- APPユーザーの作成と権限付与
- VPD関数の作成
- VPDポリシーの作成
- 各クライアント識別子での確認


## APPユーザーの作成

ここでは新しくAPPユーザーを作成します。作成の流れはSALES_APPユーザーと同じです。

```sql
-- APPユーザーを作成
CREATE USER APP IDENTIFIED BY <password>
  DEFAULT TABLESPACE USERS
  TEMPORARY TABLESPACE TEMP;

-- セッション作成権限を付与
GRANT CREATE SESSION TO APP;

-- HRスキーマ内のすべてのテーブルに対するSELECT権限を付与
GRANT SELECT ANY TABLE ON SCHEMA HR TO APP;
```

これにより、APP ユーザーはHRスキーマ内のデータにアクセスできます。


## VPD関数の作成

クライアント識別子に基づいて、表示する行を制御するVPD関数を作成します。 ここでは、例として以下の3つを識別子として作成および制御することにします。

- **Viewer**: 一般スタッフやコントリビューター職のみ(`_ACCOUNT`, `_REP`, `_CLERK`)
- **Editor**: Viewerが表示可能な行に加え、ミドルマネジメント職を表示(`_MGR`, `_MAN`, `_PROG`)
- **Admin**: すべての行を表示(`_PRES`, `_VP`, `_ASST`)

```sql title="VPD関数"
CREATE OR REPLACE FUNCTION hr.get_app_predicate(
  p_schema IN VARCHAR2,
  p_table  IN VARCHAR2
)
RETURN VARCHAR2
IS
  v_predicate VARCHAR2 (400);
BEGIN
    IF SYS_CONTEXT('USERENV', 'SESSION_USER') = 'SALES_APP' THEN
      v_predicate := 'JOB_ID LIKE ''SA_%''';
    ELSIF SYS_CONTEXT('USERENV', 'SESSION_USER') = 'APP' THEN   
    -- APPユーザーの場合、ユーザー識別子でwhere句を決定する
      IF SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER') = 'VIEWER' THEN
        v_predicate := 'REGEXP_LIKE(JOB_ID, ''_(ACCOUNT|CLERK|REP)$'')';
      ELSIF SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER') = 'EDITOR' THEN
        v_predicate := 'NOT REGEXP_LIKE(JOB_ID, ''_(PRES|VP|ASST)$'')';
      ELSIF SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER') = 'ADMIN' THEN
        v_predicate := '1=1';
      ELSE
      -- どの識別子にも該当しない場合、何も表示しない
        v_predicate := '1=2'; 
      END IF;
    ELSE
      v_predicate := '1=1';
    END IF;
  RETURN v_predicate;
END get_app_predicate;
/
```

## VPDポリシーの作成

作成したVPD関数を指定してVPDポリシーを作成していきます。 既存のポリシーがあるため、削除したのちに作成した関数を使用して新しいポリシーを作成します。

```sql
-- 既存ポリシーを削除
BEGIN
  DBMS_RLS.DROP_POLICY (
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'employees_vpd_policy'
  );
END;
/

-- 新規ポリシーを作成
BEGIN
  DBMS_RLS.ADD_POLICY (
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'employees_vpd_policy',
    function_schema => 'HR',
    policy_function => 'get_app_predicate'
  );
END;
/
```

## 各クライアント識別子での確認

以下のコマンドはすべてAPPユーザーで実行します。

```sql
-- ユーザーがAPPであることを確認
SQL> set pages 200
SQL> show user
USER is "APP"

-- クライアント識別子を設定していない場合は何も結果が返されない
SQL> SELECT employee_id, first_name, job_id FROM hr.employees;

no rows selected
```

### (1) Viewerの場合
クライアント識別子「VIEWER」を設定し、APP ユーザーでクエリを実行します。

```sql
-- クライアント識別子の設定
SQL> EXEC DBMS_SESSION.SET_IDENTIFIER('VIEWER');

-- データの確認
SQL> SELECT employee_id, first_name, job_id FROM hr.employees;

EMPLOYEE_ID FIRST_NAME           JOB_ID
----------- -------------------- ----------
        109 Daniel               FI_ACCOUNT
        110 John                 FI_ACCOUNT
        111 Ismael               FI_ACCOUNT
        112 Jose Manuel          FI_ACCOUNT
        ...
        206 William              AC_ACCOUNT

84 rows selected.
```

### (2) Editorの場合

クライアント識別子「EDITOR」を設定し、APP ユーザーでクエリを実行します。

```sql
-- クライアント識別子の設定
SQL> EXEC DBMS_SESSION.SET_IDENTIFIER('EDITOR');

-- データの確認
SQL> SELECT employee_id, first_name, job_id FROM hr.employees;

EMPLOYEE_ID FIRST_NAME           JOB_ID
----------- -------------------- ----------
        103 Alexander            IT_PROG
        104 Bruce                IT_PROG
        105 David                IT_PROG
        106 Valli                IT_PROG
        107 Diana                IT_PROG
        ...
    206 William              AC_ACCOUNT

103 rows selected.
```

### (3) Adminの場合
クライアント識別子「Admin」を設定し、APP ユーザーでクエリを実行します。

```sql
-- クライアント識別子の設定
SQL> EXEC DBMS_SESSION.SET_IDENTIFIER('ADMIN');

-- データの確認
SQL> SELECT employee_id, first_name, job_id FROM hr.employees;

EMPLOYEE_ID FIRST_NAME           JOB_ID
----------- -------------------- ----------
        100 Steven               AD_PRES
        101 Neena                AD_VP
        102 Lex                  AD_VP
        103 Alexander            IT_PROG
        104 Bruce                IT_PROG
            ...
        206 William              AC_ACCOUNT

107 rows selected.
```
