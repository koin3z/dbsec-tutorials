---
title: コマンド概要
description: TDEのチュートリアルで使用するコマンドの簡易まとめ
sidebar:
  order: 9
---

## 1. TDEの事前準備

```shell
# 初期化パラメータの設定
$ sql / as sysdba

SQL> alter system set wallet_root='/opt/oracle/admin/FREE/wallet' scope=spfile;
SQL> shutdown immediate
SQL> startup

SQL> alter system set tde_configuration='keystore_configuration=file' scope=both;
```

```shell
# CDBの設定
$ sql / as sysdba

SQL> administer key management create keystore identified by <password>;
SQL> select * from v$encryption_wallet;
SQL> administer key management set keystore open identified by <password> container=current;

SQL> administer key management set key using tag 'v1.0_MEK' identified by <password> with backup container=current;

## 確認
SQL> select * from v$encryption_wallet;
SQL> select key_id, tag, creation_time, activation_time, key_use, keystore_type, origin, backed_up, algorithm, con_id from v$encryption_keys order by activation_time desc;
```

```shell
# PDBの設定
$ sql / as sysdba
SQL> alter session set container=freepdb1;

SQL> administer key management set key using tag 'v1.1_MEK' force keystore identified by <password> with backup container=current;

## 確認
SQL> select * from v$encryption_wallet;
SQL> select key_id, tag, creation_time, activation_time, key_use, keystore_type, origin, backed_up, algorithm, con_id from v$encryption_keys order by activation_time desc;
```

## 2. 表領域の暗号化を行う

```shell
# サンプルスキーマの表領域の確認
$ sql / as sysdba
SQL> alter session set container=freepdb1;

SQL> select username, default_tablespace from dba_users where username ='HR';
SQL> select tablespace_name, file_name from dba_data_files where tablespace_name = 'USERS';

SQL> !strings /opt/oracle/oradata/FREE/FREEPDB1/users01.dbf | head -n 20
```

```shell
# 暗号化
$ sql / as sysdba
SQL> alter session set container=freepdb1;

SQL> set timing on
SQL> alter tablespace users encryption online using 'AES256' encrypt;
SQL> !strings /opt/oracle/oradata/FREE/FREEPDB1/users01.dbf | head -n 20

# 復号
SQL> alter tablespace users encryption online decrypt;
SQL> !strings /opt/oracle/oradata/FREE/FREEPDB1/users01.dbf | head -n 20
```