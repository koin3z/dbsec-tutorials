---
title: 3. DBパスワードでログインする
description: IAMデータベース・パスワード（DBパスワード）で接続し、IAMグループに基づく権限分離が機能していることを確認します。
sidebar:
  order: 3
---

ここまでに、IAM側で2種類のIAMユーザー（`iamuser-hr-admin-01` / `iamuser-hr-dev-01`）にDBパスワードを設定し、Database側でこれらのユーザーがマッピングされるグローバルユーザー（`DBUSER_IAM`）と、IAMグループに対応するグローバルロールを作成しました。

このセクションでは、各ユーザーに設定したDBパスワードで実際にDatabaseへ接続し、IAMグループに基づいた権限分離が機能していることを確認します。

> **実施内容**
> - adminユーザーでDBに接続する
> - devユーザーでDBに接続する



## 3-1. adminユーザーでDBに接続する

特別な準備は不要で、ユーザー名を `<ドメイン名>/<ユーザー名>` の形式で指定して接続します。

`/` が含まれるため、SQLcl / SQL*Plus ではユーザー名が分解されないようにダブルクォートで囲みます。

まず、 ``iamuser-hr-admin-01`` ユーザーで接続を行ってみます。

```text
$ sql -cloudconfig ./adb-wallet/Wallet_UQG5XBZV5LIND8ZF.zip /nolog

SQL> conn "domain-db/iamuser-hr-admin-01"@uqg5xbzv5lind8zf_medium
Password? (**********?) ******************
Connected.

-- ユーザー名を確認
SQL> show user
USER is "DBUSER_IAM"
```

無事、`DBUSER_IAM` ユーザーとしてアクセスすることができました。IAMユーザーで接続していても、Database上では `DBUSER_IAM` として接続できていることが分かります。

所持している権限を確認し、試しに HR スキーマに TEST テーブルを作成してみます。

```text
-- 権限を確認
SQL> select * from SESSION_PRIVS;

PRIVILEGE      
______________ 
CREATE SESSION 

-- 所有するロールを確認
SQL> select * from SESSION_ROLES;

ROLE            
_______________ 
GLROLE_HR_ADMIN 

-- グローバルロールは USER_ROLE_PRIVS には表示されない
SQL> select * from user_role_privs;

no rows selected

-- HRスキーマに対して管理権限を持つため、tableを作成できる
SQL> create table hr.test (
2      id NUMBER
3* );

Table HR.TEST created.

-- 作成したtableを削除する
SQL> drop table hr.test;

Table HR.TEST dropped.
```

この結果より、adminユーザーに割り当てた権限（GLROLE_HR_ADMIN）が適用されていることを確認できます。

## 3-2. devユーザーでDBに接続する

同様に、 `iamuser-hr-dev-01` でも接続してみます。

```text
$ sql -cloudconfig ./adb-wallet/Wallet_UQG5XBZV5LIND8ZF.zip /nolog

SQL> conn "domain-db/iamuser-hr-dev-01"@uqg5xbzv5lind8zf_medium
Password? (**********?) ******************
Connected.

-- ユーザー名を確認
SQL> show user
USER is "DBUSER_IAM"
```

admin と同様に `DBUSER_IAM` として接続されます。ここで、適用されるロールが `GLROLE_HR_DEV` になっていることを確認します。

```text
-- 権限を確認
SQL> select * from SESSION_PRIVS;

PRIVILEGE      
______________ 
CREATE SESSION 

-- 所有するロールを確認
SQL> SELECT * FROM SESSION_ROLES;

ROLE          
_____________ 
GLROLE_HR_DEV 

-- 参照権限しかないため、table作成は失敗する
SQL> create table hr.test (
2    id number
3* );

Error starting at line : 1 in command -
create table hr.test (
id number
)
Error report -
ORA-01031: insufficient privileges

https://docs.oracle.com/error-help/db/ora-01031/
01031. 00000 -  "insufficient privileges"
*Document: YES
*Cause:    A database operation was attempted without the required privilege(s).
*Action:   Ask your database administrator or security administrator to grant you the required privilege(s).
```

この結果より、devユーザーには参照権限のみが適用され、IAMグループに基づいた権限分離が機能していることを確認できます。

以上でIAM DBパスワードを用いたログインは終了です。