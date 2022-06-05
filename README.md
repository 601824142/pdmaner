# 一、软件介绍

PDManer元数建模，是一款多操作系统开源免费的桌面版关系数据库模型建模工具，相对于PowerDesigner，他具备界面简洁美观，操作简单，上手容易等特点。支持Windows,Mac,Linux等操作系统，也能够支持国产操作系统，能够支持的数据库如下：

- MySQL,PostgreSQL,Oracle,SQLServer等常见数据库
- 支持达梦，GuassDB等国产数据库
- 支持Hive，MaxCompute等大数据方向的数据库
- 用户还可以自行添加更多的数据库扩展

> 本产品基于 ES6+React+Electron+Java构建


[PDManer元数建模-4.0]，历时四年，持续升级，工匠精神，做一款简单好用的数据库建模平台。

[[PDMan-v2](https://gitee.com/robergroup/pdman)] --> [[CHINER-v3](https://gitee.com/robergroup/chiner)] --> [PDManer-v4]，连续四年，产品一直保持很好的传承和延续。

PDManer=PDMan+er(chiner的er部分，ER也表示关系图的意思)，“元数建模”的中文名称依然延续，名称需要精简，拿掉chi表示中国的前缀部分，使用中文能更加明确这是一个中国小团队的作品，4.0版本之后，产品名称：[PDManer元数建模]就此确定，承接了PDMan以及CHINER的所有功能，并且进行延续精进



# 二、PDManer元数建模，主要功能如下

**数据表管理：**  数据表，字段，注释，索引等基本功能  
**视图管理：** 实现选择多张表多个字段后，组合一个新的视图对象，视图可生成DDL以及相关程序代码，例如Java的DTO等  
**ER关系图：** 数据表可绘制ER关系图至画布，也支持概念模型等高阶抽像设计  
**数据字典：** 代码映射表管理，例如1表示男，2表示女，并且实现数据字典与数据表字段的关联  
**数据类型：** 系统实现了基础数据类型，基础数据类型在不同数据库下表现为不同数据库类型的方言，这是实现多数据**库支持的基础，为更贴近业务，引入了PowerDesigner的数据域这一概念，用于统一同一类具有同样业务属性字段的批量设置类型，长度等。基础数据类型以及数据域，用户均可自行添加，自行定义。  
**多数据库：** 内置主流常见数据库，如MySQL，PostgreSQL，SQLServer，Oracle等，并且支持用户自行添加新的数据库。  
**代码生成：** 内置Java，Mybatis，MyBatisPlus等常规情况下Controller，Service，Mapper的生成，也添加了C#语言支持，可自行扩展对其他语言的支持，如Python等  
**版本管理：** 实现数据表的版本管理，可生成增量DDL脚本  
**生态对接：** 能够导入PowerDesigner的pdm文件，老版本的PDMan文件，也能导出为word文档，导出相关设置等

# 三、软件下载
https://gitee.com/robergroup/pdmaner/releases

# 四、特别说明
1. 如果你只是为了使用，请直接下载安装版。
2. 如果你为了研究，你可以自行clone代码到本地研究源代码，阅读源代码需要较高的前端基础。
3. 安装文件都是基于当时master分支打包的，不存在编译不通过问题。
4. 作者很忙，时间有限，作者不解答初级前端问题，还请多多理解支持。
5. 非常欢迎提PR的同学

# 五、操作手册地址
1. [官网操作手册-语雀版](https://www.yuque.com/pdmaner/docs)
2. [oschina pdman专栏](https://my.oschina.net/skymozn?tab=newest&catalogId=5775221&sortType=time)