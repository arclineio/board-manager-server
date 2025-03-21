# board-manager-server

```sql
DROP
TABLE IF EXISTS `v2_emby`;

CREATE TABLE `v2_emby` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int(11) NOT NULL COMMENT '用户 ID',
  `telegram_id` bigint(20) NOT NULL COMMENT 'Telegram ID',
  `points` int(11) NOT NULL DEFAULT '0' COMMENT '签到积分',
  `lastsign_at` datetime NOT NULL COMMENT '上次签到时间',
  `emby_id` varchar(64) NOT NULL COMMENT 'Emby ID',
  `username` varchar(64) NOT NULL COMMENT 'Emby 用户名',
  `password` varchar(64) NOT NULL COMMENT 'Emby 密码',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `telegram_id` (`telegram_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Emby 信息记录表';
```
