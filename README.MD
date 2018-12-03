# 1. Setup All Databases: MongoDB, Redis, MySQL

## 1.1 Pull MongoDB docker container

### Pull mongo image

```sh
$ docker pull mongo
```

### Run container some-mongo

Expose host port 47017 for mongod service on some-mongo container

```sh
$ docker run -p 47017:27017 --name mongo-test -d mongo
```

## 1.2 Pull Redis docker container

### Pull redis image

```sh
$ docker pull redis
```

### Run contaienr redis

Expose host port 7379 for redis service on redis container
```sh
$ docker run --name redis -p 8379:6379 -d redis
```

### Run tools support connect redis

```sh
$ sudo npm install -g redis-commander
```

```sh
$ redis-commander --redis-port 8379 
```

* Note: Clear config if need to change something
```sh
$ redis-commander --clear-config
```

### view redis manager on browser

```
http://localhost:8081
```

## 1.3 Pull MySQL docker container

### Pull mysql image

```sh
$ docker pull mysql
```

### Run container mysql-test

```sh
$ docker run --name mysql-test -p 3308:3306 -e MYSQL_ROOT_PASSWORD=<YourPassword> -d mysql --default-authentication-plugin=mysql_native_password
```

* Note: Update <YourPassword> to line 98 of test.js

### Create Table Structure

Use command to create 'coinvalues' table

```sql
USE maxcoin;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `coinvalues`
-- ----------------------------
DROP TABLE IF EXISTS `coinvalues`;
CREATE TABLE `coinvalues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `valuedate` date DEFAULT NULL,
  `coinvalue` decimal(16,8) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
```

# 2. Test connection to all database

## Clone source code
```sh
$ git clone https://github.com/quangvt/maxcoin.git

$ cd maxcoin

$ node test
```