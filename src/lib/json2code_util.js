// 差异化数据转化成SQL或者代码信息
import React from 'react';
import _ from 'lodash/object';
import { Message, FormatMessage } from '../components';
import doT from 'dot';

import { separator } from '../../profile';
import {firstUp} from './string';
import {getDefaultTemplate, transform} from './datasource_util';
import {platform} from './middle';

const demoGroup = [{defKey: "DEFAULT_GROUP", defName: "默认分组"}];
const demoTable = {
  entity: {
    "defKey": "SIMS_STUDENT",
    "defName": "学生",
    "comment": "",
    "env": {
      "base": {"nameSpace":"cn.chiner.domain","codeRoot":"SimsStudent"},
      "template":{
        "JAVA": {
          "content":{
            "suffix":"demo/entity/{{=it.codeRoot}}Entity.java"
          }
        }
      },
      "custom":{"xpath":"xxx"}},
    "properties": {
      "partitioned by": "(pt_d string)",
      "row format delimited": "",
      "fields terminated by": "','",
      "collection items terminated by": "'-'"
    },
    "nameTemplate": "{defKey}[{defName}]",
    "fields": [
      {
        "defKey": "COLLEGE_ID",
        "defName": "所在学院ID",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": true,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "IdOrKey",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "CLASS_ID",
        "defName": "所在班级ID",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": true,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "IdOrKey",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "STUDENT_ID",
        "defName": "学生ID",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": true,
        "notNull": true,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "IdOrKey",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "STUDENT_NAME",
        "defName": "学生姓名",
        "comment": "",
        "len": 90,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Name",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "ENG_NAME",
        "defName": "英文名",
        "comment": "",
        "len": 90,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Name",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "ID_CARD_NO",
        "defName": "身份证号",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "MOBILE_PHONE",
        "defName": "手机号",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "GENDER",
        "defName": "性别",
        "comment": "",
        "len": "32",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "'M'",
        "hideInGraph": false,
        "domain": "Dict",
        "refDict": "Gender",
        "refDictData": {
          "defKey": "Gender",
          "defName": "性别",
          "intro": "",
          "items": [
            {
              "defKey": "M",
              "defName": "男",
              "intro": "",
              "parentKey": "",
              "enabled": true,
              "attr1": "",
              "attr2": "",
              "attr3": "",
              "sort": "1"
            },
            {
              "defKey": "F",
              "defName": "女",
              "intro": "",
              "parentKey": "",
              "enabled": true,
              "attr1": "",
              "attr2": "",
              "attr3": "",
              "sort": "2"
            },
            {
              "defKey": "U",
              "defName": "未知",
              "intro": "",
              "parentKey": "",
              "enabled": true,
              "attr1": "",
              "attr2": "",
              "attr3": "",
              "sort": "3"
            }
          ]
        },
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "MONTHLY_SALARY",
        "defName": "月薪",
        "comment": "",
        "len": 24,
        "scale": 6,
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Money",
        "type": "Double",
        "dbType": "DECIMAL"
      },
      {
        "defKey": "BIRTH",
        "defName": "出生日期",
        "comment": "",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "DateTime",
        "type": "Date",
        "dbType": "DATETIME"
      },
      {
        "defKey": "AVATAR",
        "defName": "头像",
        "comment": "",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Int",
        "type": "Integer",
        "dbType": "INT"
      },
      {
        "defKey": "HEIGHT",
        "defName": "身高",
        "comment": "",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Int",
        "type": "Integer",
        "dbType": "INT"
      },
      {
        "defKey": "WEIGHT",
        "defName": "体重",
        "comment": "",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Int",
        "type": "Integer",
        "dbType": "INT"
      },
      {
        "defKey": "NATION",
        "defName": "名族",
        "comment": "",
        "len": "32",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "'01'",
        "hideInGraph": false,
        "domain": "Dict",
        "refDict": "GBNation",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "POLITICAL",
        "defName": "政治面貌",
        "comment": "",
        "len": "32",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Dict",
        "refDict": "Political",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "MARITAL",
        "defName": "婚姻状况",
        "comment": "",
        "len": "32",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "'UNMARRIED'",
        "hideInGraph": true,
        "domain": "Dict",
        "refDict": "Marital",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "DOMICILE_PLACE_PROVINCE",
        "defName": "籍贯（省）",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "DOMICILE_PLACE_CITY",
        "defName": "籍贯（市）",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "DOMICILE_PLACE_ADDRESS",
        "defName": "户籍地址",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "HOBBY",
        "defName": "爱好",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "INTRO",
        "defName": "简要介绍",
        "comment": "",
        "len": "900",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DescText",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "PRESENT_ADDRESS",
        "defName": "居住地址",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "EMAIL",
        "defName": "电子邮件",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DefaultString",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "ENTRY_DATE",
        "defName": "入学日期",
        "comment": "",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "DateTime",
        "type": "Date",
        "dbType": "DATETIME"
      },
      {
        "defKey": "STATUS",
        "defName": "状态",
        "comment": "",
        "len": "32",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "'Normal'",
        "hideInGraph": true,
        "domain": "Dict",
        "refDict": "StudentStatus",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "TENANT_ID",
        "defName": "租户号",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "IdOrKey",
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "REVISION",
        "defName": "乐观锁",
        "comment": "",
        "domain": "Int",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "CREATED_BY",
        "defName": "创建人",
        "comment": "",
        "domain": "IdOrKey",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "CREATED_TIME",
        "defName": "创建时间",
        "comment": "",
        "domain": "DateTime",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "type": "Integer",
        "dbType": "INT"
      },
      {
        "defKey": "UPDATED_BY",
        "defName": "更新人",
        "comment": "",
        "domain": "IdOrKey",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "type": "String",
        "dbType": "VARCHAR"
      },
      {
        "defKey": "UPDATED_TIME",
        "defName": "更新时间",
        "comment": "",
        "domain": "DateTime",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "type": "Date",
        "dbType": "DATETIME"
      }
    ],
    "correlations": [
      {
        "myField": "CLASS_ID",
        "refEntity": "SIMS_CLASS",
        "refField": "CLASS_ID",
        "myRows": "n",
        "refRows": "1",
        "innerType": ""
      }
    ],
    "indexes": [
      {
        "defKey": "idx_smis_student_01",
        "defName": null,
        "unique": false,
        "comment": "",
        "fields": [
          {
            "fieldDefKey": "STUDENT_NAME",
            "ascOrDesc": "A"
          },
          {
            "fieldDefKey": "ENG_NAME",
            "ascOrDesc": "A"
          }
        ]
      },
      {
        "defKey": "idx_smis_student_cert",
        "defName": null,
        "unique": false,
        "comment": "",
        "fields": [
          {
            "fieldDefKey": "ID_CARD_NO",
            "ascOrDesc": "A"
          }
        ]
      }
    ],
    "refEntities": ["SIMS_STUDENT"],
  },
  group: demoGroup,
};
const demoDict =  {
  dict: {
    "defKey": "Gender",
    "defName": "性别",
    "intro": "",
    "items": [
      {
        "defKey": "M",
        "defName": "男",
        "intro": "",
        "parentKey": "",
        "enabled": true,
        "attr1": "",
        "attr2": "",
        "attr3": "",
        "sort": "1"
      },
      {
        "defKey": "F",
        "defName": "女",
        "intro": "",
        "parentKey": "",
        "enabled": true,
        "attr1": "",
        "attr2": "",
        "attr3": "",
        "sort": "2"
      },
      {
        "defKey": "U",
        "defName": "未知",
        "intro": "",
        "parentKey": "",
        "enabled": true,
        "attr1": "",
        "attr2": "",
        "attr3": "",
        "sort": "3"
      }
    ]
  },
  group: demoGroup,
};
const demoView = {
  view:     {
    "defKey": "SMIS_STUDENT_EXAM",
    "defName": "学生考试",
    "comment": "",
    "properties": {
      "partitionBy": ""
    },
    "nameTemplate": "{defKey}[{defName}]",
    "headers": [
      {
        "refKey": "hideInGraph",
        "hideInGraph": true
      },
      {
        "refKey": "defKey",
        "hideInGraph": false
      },
      {
        "refKey": "refEntity",
        "hideInGraph": true
      },
      {
        "refKey": "defName",
        "hideInGraph": false
      },
      {
        "refKey": "primaryKey",
        "hideInGraph": false
      },
      {
        "refKey": "notNull",
        "hideInGraph": true
      },
      {
        "refKey": "autoIncrement",
        "hideInGraph": true
      },
      {
        "refKey": "domain",
        "hideInGraph": false
      },
      {
        "refKey": "type",
        "hideInGraph": true
      },
      {
        "refKey": "len",
        "hideInGraph": true
      },
      {
        "refKey": "scale",
        "hideInGraph": true
      },
      {
        "refKey": "remark",
        "hideInGraph": true
      },
      {
        "refKey": "refDict",
        "hideInGraph": true
      },
      {
        "refKey": "defaultValue",
        "hideInGraph": true
      },
      {
        "refKey": "isStandard",
        "hideInGraph": false
      },
      {
        "freeze": false,
        "refKey": "uiHint",
        "hideInGraph": true
      }
    ],
    "fields": [
      {
        "defKey": "STUDENT_ID",
        "defName": "学生ID",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "IdOrKey",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "STUDENT_ID",
        "type": "VARCHAR"
      },
      {
        "defKey": "STUDENT_NAME",
        "defName": "学生姓名",
        "comment": "",
        "len": 90,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Name",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "STUDENT_NAME",
        "type": "VARCHAR"
      },
      {
        "defKey": "MOBILE_PHONE",
        "defName": "手机号",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "DefaultString",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "MOBILE_PHONE",
        "type": "VARCHAR"
      },
      {
        "defKey": "GENDER",
        "defName": "性别",
        "comment": "",
        "len": "32",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Dict",
        "refDict": "Gender",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "GENDER",
        "type": "VARCHAR"
      },
      {
        "defKey": "LESSON_NAME",
        "defName": "课程名",
        "comment": "",
        "len": 90,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Name",
        "refEntity": "SIMS_LESSON",
        "refEntityField": "LESSON_NAME",
        "type": "VARCHAR"
      },
      {
        "defKey": "LESSON_ID",
        "defName": "课程ID",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "IdOrKey",
        "refEntity": "SIMS_LESSON",
        "refEntityField": "LESSON_ID",
        "type": "VARCHAR"
      },
      {
        "defKey": "EXAM_DATE",
        "defName": "考试日期",
        "comment": "",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "DateTime",
        "refEntity": "SIMS_EXAM",
        "refEntityField": "EXAM_DATE",
        "type": "DATETIME"
      },
      {
        "defKey": "EXAM_SCORE",
        "defName": "考试分数",
        "comment": "",
        "len": 24,
        "scale": "8",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Double",
        "refEntity": "SIMS_EXAM",
        "refEntityField": "EXAM_SCORE",
        "type": "DECIMAL"
      },
      {
        "defKey": "TENANT_ID",
        "defName": "租户号",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "IdOrKey",
        "refEntity": "SIMS_EXAM",
        "refEntityField": "TENANT_ID",
        "type": "VARCHAR"
      },
      {
        "defKey": "REVISION",
        "defName": "乐观锁",
        "comment": "",
        "domain": "Int",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "REVISION",
        "type": "INT"
      },
      {
        "defKey": "CREATED_BY",
        "defName": "创建人",
        "comment": "",
        "domain": "IdOrKey",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "CREATED_BY",
        "type": "VARCHAR"
      },
      {
        "defKey": "CREATED_TIME",
        "defName": "创建时间",
        "comment": "",
        "domain": "DateTime",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "CREATED_TIME",
        "type": "DATETIME"
      },
      {
        "defKey": "UPDATED_BY",
        "defName": "更新人",
        "comment": "",
        "domain": "IdOrKey",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "UPDATED_BY",
        "type": "VARCHAR"
      },
      {
        "defKey": "UPDATED_TIME",
        "defName": "更新时间",
        "comment": "",
        "domain": "DateTime",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "UPDATED_TIME",
        "type": "DATETIME"
      }
    ],
    "correlations": [],
    "refEntities": [
      "SIMS_STUDENT",
      "SIMS_EXAM",
      "SIMS_LESSON"
    ]
  },
  group: demoGroup,
};
const demoVersionData =  {
  id: '26B8D13E-BE37-4E20-8496-13A586E84581',
  //表基础信息,表变更之前的
  baseInfo: {
    "defKey": "SIMS_COLLEGE",
    "defName": "学院",
    "comment": "",
  },
  //表基础信息变更
  baseChanged: {
    before: {
      "defKey": "SIMS_COLLEGE",
      "defName": "学院",
      "comment": "",
    }, after: {
      "defKey": "SIMS_COLLEGE1",
      "defName": "学院1",
      "comment": "新的",
    }
  },
  //字段调整,样本数据放两条
  fieldAdded: [{
    "index": 3,
    "beforeFieldKey": null,   //如果没有就设置为空
    "afterFieldKey": null,    //如果没有就设置为空
    //以下是字段的所有信息
    "defKey": "COLLEGE_ID",
    "defName": "所在学院ID",
    "comment": "",
    "len": 32,
    "scale": "",
    "primaryKey": false,
    "notNull": true,
    "autoIncrement": false,
    "defaultValue": "",
    "hideInGraph": false,
    "domain": "IdOrKey",
    "type": "String",
    "dbType": "VARCHAR"
  }],
  fieldRemoved: [{
    "defKey": "COLLEGE_ID",
    "defName": "所在学院ID",
    "comment": "",
    "len": 32,
    "scale": "",
    "primaryKey": false,
    "notNull": true,
    "autoIncrement": false,
    "defaultValue": "",
    "hideInGraph": false,
    "domain": "IdOrKey",
    "type": "String",
    "dbType": "VARCHAR"
  }],
  fieldModified: [{
    before: {
      //字段的全部信息
      "defKey": "COLLEGE_ID",
      "defName": "所在学院ID",
      "comment": "",
      "len": 32,
      "scale": "",
      "primaryKey": false,
      "notNull": true,
      "autoIncrement": false,
      "defaultValue": "",
      "hideInGraph": false,
      "domain": "IdOrKey",
      "type": "String",
      "dbType": "VARCHAR"
    }, after: {
      "defKey": "COLLEGE_ID",
      "defName": "所在学院ID",
      "comment": "",
      "len": 32,
      "scale": "",
      "primaryKey": false,
      "notNull": true,
      "autoIncrement": false,
      "defaultValue": "",
      "hideInGraph": false,
      "domain": "IdOrKey",
      "type": "String",
      "dbType": "VARCHAR"
    }
  }],
  //扩展属性调整
  propAdded: [{key: "partitioned by", value: "(pt_d string)"}],
  propRemoved: [{key: "row format delimited", value: ""}],
  propModified: [{before: {key: "fields terminated by", value: ","}, after: {key: "fields terminated by", value: ","}}],
  //关联实体调整,样本数据放两条
  refEntityAdd: [{
    "defKey": "SIMS_COLLEGE",
    "defName": "学院",
    "comment": "",
  }],
  refEntityRemoved: [{
    "defKey": "SIMS_COLLEGE",
    "defName": "学院",
    "comment": "",
  }],
  //索引调整
  indexChanged:true,
  indexAdded:[demoTable.entity.indexes[0]],
  indexRemoved:[demoTable.entity.indexes[1]],
  indexModified:[{
    before: demoTable.entity.indexes[0],
    after: demoTable.entity.indexes[1],
  }],
  fullFields: demoTable.entity.fields,
  newIndexes: demoTable.entity.indexes,
};
const demoChanges =  [
    {type: 'entity', opt: 'delete', data: demoTable.entity},
    {type: 'entity', opt: 'add', data: demoTable.entity},
    {type: 'entity', opt: 'update', data: demoVersionData},
];

export const openUrl = (url) => {
  const href = url;
  if (platform === 'json') {
    // eslint-disable-next-line global-require,import/no-extraneous-dependencies
    require('electron').shell.openExternal(href);
  } else {
    const a = document.createElement('a');
    a.href = href;
    a.click();
  }
};

export const camel = (str, firstUpper) => {
  let ret = str.toLowerCase();
  ret = ret.replace( /_([\w+])/g, function( all, letter ) {
    return letter.toUpperCase();
  });
  if(firstUpper){
    ret = ret.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
      return $1.toUpperCase() + $2;
    });
  }
  return ret;
};
const getDefaultEnv = (e) => {
  return {
    ...(e.env || {}),
    base: {
      ...(e.env?.base || {}),
      nameSpace: e.env?.base?.nameSpace || '',
      codeRoot: e.env?.base?.codeRoot || camel(e.defKey, true),
    }
  }
}
// 根据模板数据生成代码
export const getTemplateString = (template, templateData, isDemo, dataSource , code) => {
  const underline = (str, upper) => {
    const ret = str.replace(/([A-Z])/g,"_$1");
    if(upper){
      return ret.toUpperCase();
    }else{
      return ret.toLowerCase();
    }
  };
  const upperCase = (str) => {
    return str.toLocaleUpperCase();
  };
  const lowerCase = (str) => {
    return str.toLocaleLowerCase();
  };
  const join = (...args) => {
    if(args.length<=2)return args[0];
    const datas = [];
    const delimter = args[args.length-1];
    for(let i=0;i<args.length-1;i++){
      if(/^\s*$/.test(args[i]))continue;
      datas.push(args[i]);
    }
    return datas.join(delimter);
  };
  const objectkit = {
    isJSON: function(obj) {
      var isjson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
      return isjson;
    },
    deepClone: function(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    equals: function(v1, v2) {
      if (typeof(v1) === "object" && objectkit.isJSON(v1) && typeof(v2) === "object" && objectkit.isJSON(v2)) {
        return JSON.stringify(v1) == JSON.stringify(v2);
      } else {
        return v1 == v2;
      }

    }
  };
  const getIndex = (array, arg, n) => {
    var i = isNaN(n) || n < 0 ? 0 : n;
    for (; i < array.length; i++) {
      if (array[i] == arg) {
        return i;
      } else if (typeof(array[i]) === "object" && objectkit.equals(array[i], arg)) {
        return i;
      }
    }
    return -1;
  };
  const contains = (array, obj) => {
    return getIndex(array, obj) >= 0;
  };
  const uniquelize = (array) => {
    var copy = clone(array);
    const temp = [];
    for (var i = 0; i < copy.length; i++) {
      if (!contains(temp, copy[i])) {
        temp.push(copy[i]);
      }
    }
    return temp;
  };
  const clone = (array) => {
    var cloneList = Array();
    for (var i = 0, a = 0; i < array.length; i++) {
      cloneList.push(array[i]);
    }
    return cloneList;
  };
  const each = (array, fn) => {
    fn = fn || Function.K;
    var a = [];
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < array.length; i++) {
      var res = fn.apply(array, [array[i], i].concat(args));
      if (res != null) a.push(res);
    }
    return a;
  };
  const intersect = (array1, array2) => {
    // 交集
    const copy = clone(array1);
    const r = each(uniquelize(copy), function(o) { return contains(array2, o) ? o : null });
    return [].concat(r);
  };
  const union = (array1, array2) => {
    var copy = clone(array1);
    var r = uniquelize(copy.concat(array2));
    return [].concat(r);
  };
  const minus = (array1, array2) => {
    var copy = clone(array1);
    var r = each(uniquelize(copy), function(o) { return contains(array2, o) ? null : o });
    return [].concat(r);
  };
  const tplText = template.replace(/(^\s*)|(\s*$)/g, "");
  const getCode = () => {
    return code || _.get(dataSource, 'profile.default.db', dataSource.profile?.dataTypeSupports[0]?.id);
  }
  const getTemplate = () => {
    const allTemplate = _.get(dataSource, 'profile.codeTemplates', []);
    return allTemplate.filter(t => t.applyFor === getCode())[0] || {};
  };
  const currentEntityIndexRebuildDDL = (baseInfo, newIndexes = [], fields = [], type = 'entity') => {
    const codeTemplate = getTemplate();
    const data = isDemo ? demoTable.entity : {...baseInfo, fields, indexes: newIndexes};
    return `${getTemplateString(codeTemplate.deleteIndex || getEmptyMessage('deleteIndex', dataSource, getCode()), {
      [type]: {
        ...data,
        env: getDefaultEnv(data),
      },
      separator: templateData.sqlSeparator,
    })}${getTemplateString(codeTemplate.createIndex || getEmptyMessage('createIndex', dataSource, getCode()), {
      [type]: {
        ...data,
        env: getDefaultEnv(data),
      },
      separator: templateData.sqlSeparator,
    })}`
  }
  const currentEntityDropDDL = (data, type = 'entity') => {
    const codeTemplate = getTemplate();
    return getTemplateString(codeTemplate.deleteTable || getEmptyMessage('deleteTable', dataSource, getCode()), {
      [type]: { defKey: isDemo ? demoTable.entity.defKey : data.defKey },
      type,
      separator: templateData.sqlSeparator,
    });
  };
  const currentEntityCreateDDL = (data, type = 'entity') => {
    const codeTemplate = getTemplate();
    const name = type === 'entity' ? 'createTable' : 'createView';
    return getTemplateString(codeTemplate[name] || getEmptyMessage(name, dataSource, getCode()), {
      [type]: isDemo ? demoTable.entity : {
        ...data,
        env: getDefaultEnv(data),
      },
      separator: templateData.sqlSeparator,
    });
  }
  const conf = {
    evaluate:    /\{\{([\s\S]+?)\}\}/g,
    interpolate: /\{\{=([\s\S]+?)\}\}/g,
    encode:      /\{\{!([\s\S]+?)\}\}/g,
    use:         /\{\{#([\s\S]+?)\}\}/g,
    define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
    conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
    iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
    varname: 'it',
    strip: false,
    append: true,
    doNotSkipEncoded:false,
    selfcontained: false
  };
  let resultText = doT.template(tplText, conf)({
    ...templateData,
    func: {
      camel: camel,
      underline: underline,
      upperCase: upperCase,
      lowerCase: lowerCase,
      join: join,
      intersect: intersect,
      union: union,
      minus: minus,
      indexRebuildDDL: currentEntityIndexRebuildDDL,
      dropDDL: currentEntityDropDDL,
      createDDL: currentEntityCreateDDL,
    }
  });
  resultText = resultText.replace(/\n(\n)*( )*(\n)*\n/g,"\n");  //删除空行
  resultText = resultText.replace(/\r\n(\r\n)*( )*(\r\n)*\r\n/g,"\r\n"); //(不同操作系统换行符有区别)删除空行
  resultText = resultText.replace(/\$blankline/g,'');              //单独处理需要空行的情况
  return resultText;
};
// 生成增量代码数据
const generateIncreaseSql = (dataSource, group, dataTable, code, templateShow) => {
  // 获取该数据库下的模板信息
  const allTemplate = _.get(dataSource, 'profile.codeTemplates', []);
  // appCode
  const tData = allTemplate.filter(t => t.applyFor === code)[0];
  const template = tData?.[templateShow] || getDefaultTemplate(code, templateShow, dataSource);
  const type = tData?.type;
  const sqlSeparator = _.get(dataSource, 'profile.sql.delimiter', ';');
  // 构造新的数据表传递给模板
  const fields = (dataTable.fields || []);
  const indexes = (dataTable.indexes || []);
  const tempDataTable = {
    ...dataTable,
    env: getDefaultEnv(dataTable),
    fields: templateShow === 'createIndex' ? fields : fields.map(field => {
      return {
        ...field,
        ...transform(field, dataSource, code, 'id', type),
      }
    }),
    indexes: templateShow === 'createIndex' ? indexes.map(i => {
      return {
        ...i,
        fields: (i.fields || []).map(f => {
          return {
            ...f,
            fieldDefKey: fields.filter(field => field.id === f.fieldDefKey)[0]?.defKey,
          };
        }),
      }
    }) : indexes,
  };
  const name = templateShow === 'createView' ? 'view' : 'entity';
  const templateData = {
    [name]: tempDataTable,
    group,
    separator: sqlSeparator
  };
  if (!templateShow) {
    const dataTypeSupports = (dataSource.profile?.dataTypeSupports || []).filter(t => t.id === code)[0]
    return Object.keys(_.omit(tData, ['type', 'applyFor']))
        .map(t => {
          return {
            name: t,
            suffix: getTemplateString(tempDataTable.env?.template?.[dataTypeSupports.defKey]?.[t]?.suffix || '', {
              ...tempDataTable.env?.base || {},
              codeRoot: tempDataTable.env?.base?.codeRoot || camel(tempDataTable.defKey, true) || '',
            }) || t,
            code: getTemplateString(tData[t] || '', templateData),
          }
        });
  }
  return getTemplateString(template, templateData);
};
// 获取单个数据表的各个模板的代码
export const getCodeByDataTable = (dataSource, group, dataTable, code, templateShow) => {
  let sqlString = '';
  try {
      sqlString = generateIncreaseSql(dataSource, group, dataTable, code, templateShow);
  } catch (e) {
    console.error(e);
    Message.error({title: <span>
        {FormatMessage.string({id: 'database.templateError'})}
        <FormatMessage id='database.templateErrorLink'/>
        <a onClick={() => openUrl('http://wwww.xxx.como/xxx')}>http://wwww.xxx.como/xxx</a>
      </span>});
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};
// 获取demo数据的代码
export const getDemoTemplateData = (templateShow) => {
  let data = '';
  switch (templateShow) {
    case 'content':
      data = JSON.stringify({...demoTable, separator: ';'}, null, 2);
      break;
    case 'createTable':
      data = JSON.stringify({...demoTable, separator: ';'}, null, 2);
      break;
    case 'createView':
      data = JSON.stringify({...demoView, separator: ';'}, null, 2);
      break;
    case 'createIndex':
      data = JSON.stringify({
        ...demoTable,
        separator: ';'
      }, null, 2);
      break;
    case 'deleteIndex':
      data = JSON.stringify({
        ...demoTable,
        separator: ';'
      }, null, 2);
      break;
    case 'dictSQLTemplate':
      data = JSON.stringify({
        ...demoDict,
        separator: ';'
      }, null, 2);
      break;
    case 'deleteTable':
      data = JSON.stringify({
        entity: {
          defKey: demoTable.entity.defKey,
        },
        type: 'entity',
        separator: ';'
      }, null, 2);
      break;
    case 'renameTable':
      data = JSON.stringify({
        old: {
          defKey: demoTable.entity.defKey
        },
        new: {
          defKey: `${demoTable.entity.defKey}_NEW`
        },
        separator: ';',
        type: 'entity',
      }, null, 2);
      break;
    case 'addField':
      data = JSON.stringify({
        entity: demoTable.entity,
        newField: {
          ...demoTable.entity.fields[1],
          beforeDefKey: demoTable.entity.fields[2].defKey,
          afterDefKey: demoTable.entity.fields[0].defKey,
          fieldIndex: 1,
        },
        separator: ';'
      }, null, 2);
      break;
    case 'deleteField':
      data = JSON.stringify({
        field: demoTable.entity.fields[0],
        separator: ';'
      }, null, 2);
      break;
    case 'updateField':
      data = JSON.stringify({
        old: {
          defKey: demoTable.entity.fields[0].defKey
        },
        new: {
          defKey: `${demoTable.entity.fields[0].defKey}_NEW`
        },
        separator: ';'
      }, null, 2);
      break;
    case 'message':
      data = JSON.stringify({
        changes: demoChanges,
        separator: ';'
      }, null, 2);
      break;
    case 'update':
      data = JSON.stringify({
        changes: demoChanges,
        separator: ';'
      }, null, 2);
      break;
    default:
      data = JSON.stringify({...demoTable, separator: ';'}, null, 2);
      break;
  }
  return data;
};
// 传入模板内容和数据 返回代码信息
export const getDataByTemplate = (data, template, isDemo, dataSource, code) => {
  let sqlString = '';
  try {
    sqlString = getTemplateString(template, data, isDemo, dataSource, code);
  } catch (e) {
    //Message.error({title: FormatMessage.string({id: 'database.templateError'})});
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};
// 获取项目的一些配置信息
const getDataSourceProfile = (data) => {
  const dataSource = {...data};
  const datatype = _.get(dataSource, 'dataTypeMapping.mappings', []);
  const allTemplate = _.get(dataSource, 'profile.codeTemplates', []);
  const sqlSeparator = _.get(dataSource, 'profile.sql.delimiter', ';') || ';';
  return {
    dataSource,
    datatype,
    allTemplate,
    sqlSeparator
  };
};
// 获取所有数据表的全量脚本（filter）
export const getAllDataSQLByFilter = (data, code, filterTemplate, filterDefKey) => {
  // 获取全量脚本（删表，建表，建索引，表注释）
  const { dataSource, allTemplate, sqlSeparator } = getDataSourceProfile(data);
  const getTemplate = (templateShow) => {
    return allTemplate.filter(t => t.applyFor === code)[0]?.[templateShow] || '';
  };
  const getFilterData = (name) => {
    return (dataSource[name] || []).filter(e => {
      if (filterDefKey) {
        return (filterDefKey[name] || []).includes(e.id);
      }
      return true;
    }).map(e => ({
      ...e,
      datatype: name,
      groupType: `ref${firstUp(name)}`
    }));
  };
  let sqlString = '';
  try {
    const tempData = code === 'dictSQLTemplate' ? getFilterData('dicts') : getFilterData('entities')
        .concat(getFilterData('views'));
    sqlString += tempData.map(e => {
      const tempTemplate = [...filterTemplate];
      let tempData = '';
      let data;
      if (code === 'dictSQLTemplate') {
        data = {
          dict: _.omit(e, ['groupType', 'datatype']),
        }
      } else {
        const name = e.datatype === 'entities' ? 'entity' : 'view';
        const childData = {
          ..._.omit(e, ['groupType', 'datatype']),
          env: getDefaultEnv(e),
          fields: (e.fields || []).map(field => {
            return {
              ...field,
              ...transform(field, dataSource, code)
            }
          }),
          indexes: (e.indexes || []).map(i => {
            return {
              ...i,
              fields: (i.fields || []).map(f => {
                const field = (e.fields || []).filter(ie => f.fieldDefKey === ie.id)[0];
                return {
                  ...f,
                  fieldDefKey: field?.defKey || '',
                };
              })
            }
          }),
        };
        if (name === 'view') {
          childData.refEntities = dataSource?.entities
            ?.filter(e => childData?.refEntities.includes(e.id))
            ?.map(e => e.defKey);
        }
        data = {
          entity: childData,
          view: childData,
        }
      }
      const templateData = {
        ...data,
        group: (dataSource.viewGroups || [])
            .filter(g => g[e.groupType].includes(e.id))
            .map(g => _.pick(g, ['defKey', 'defName'])),
        separator: sqlSeparator
      };
      if (tempTemplate.includes('createTable')) {
        tempTemplate.push('createView');
      }
      tempTemplate.filter(t => {
        if (e.datatype === 'entities') {
          return t !== 'createView';
        }
        return t !== 'createTable';
      }).forEach(f => {
        const code = `${getTemplateString(getTemplate(f), templateData)}`;
        tempData += code ? `${code}\n` : '';
      });
      return tempData;
    }).join('');
  } catch (e) {
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};
export const getEmptyMessage = (name, dataSource, code) => {
  // 数据库[MySQL]的版本模板[增加字段]没有维护
  const support = _.get(dataSource, 'profile.dataTypeSupports', []).filter(s => s.id === code)[0];
  return `# ${FormatMessage.string({
    id: 'versionData.templateEmpty',
    data: {
      name: support?.defKey || code,
      type: FormatMessage.string({id: `tableTemplate.${name}`})
    }
  })}`;
};
// 根据变更信息生成代码
export const getDataByChanges = (changes, dataSource) => {
  try {
    const code = _.get(dataSource, 'profile.default.db', dataSource.profile?.dataTypeSupports[0]?.id);
    const allTemplate = _.get(dataSource, 'profile.codeTemplates', []);
    const codeTemplate = allTemplate.filter(t => t.applyFor === code)[0] || {};
    const sqlSeparator = _.get(dataSource, 'profile.sql.delimiter', ';');
    return getTemplateString(codeTemplate.update || getDefaultTemplate(code, 'update', dataSource), {
      changes,
      separator: sqlSeparator,
    }, false, dataSource, code);
    // return changes.map(c => {
    //   if (c.type === 'entity' || c.type === 'view') {
    //     if (c.opt === 'delete') {
    //       return getTemplateString(codeTemplate.deleteTable || getEmptyMessage('deleteTable', dataSource, code), {
    //         defKey: c.data.defKey,
    //         type: c.type,
    //         separator: sqlSeparator,
    //       });
    //     } else if (c.opt === 'update') {
    //       return getTemplateString(codeTemplate.update || getEmptyMessage('update', dataSource, code), {
    //         ...c.data,
    //         type: c.type,
    //         separator: sqlSeparator,
    //       }, false, dataSource, code);
    //     } else if (c.opt === 'add') {
    //       const name = c.type === 'entity' ? 'createTable' : 'createView';
    //       return getTemplateString(codeTemplate[name] || getEmptyMessage(name, dataSource, code), {
    //         [c.type]: {
    //           ...c.data,
    //           env: getDefaultEnv(c.data),
    //           fields: (c.data.fields || []).map(f => ({...f, ...transform(f, dataSource, code)})),
    //           indexes: (c.data.indexes || []).map(i => {
    //             return {
    //               ...i,
    //               fields: (i.fields || []).map(f => {
    //                 const field = (c.data.fields || []).filter(ie => f.fieldDefKey === ie.id)[0];
    //                 return {
    //                   ...f,
    //                   fieldDefKey: field?.defKey || '',
    //                 };
    //               })
    //             }
    //           }),
    //         },
    //         separator: sqlSeparator,
    //       });
    //     }
    //     return '';
    //   }
    //   // else if (c.type === 'field') {
    //   //   if (c.opt === 'add') {
    //   //     const parent = c.parent?.[1] || {};
    //   //     return getTemplateString(codeTemplate.addField || getEmptyMessage('addField', dataSource, code), {
    //   //       [parent.type]: parent,
    //   //       newField: {
    //   //         ...c.data.current,
    //   //         beforeDefKey: c.data.before.defKey,
    //   //         afterDefKey: c.data.after.defKey,
    //   //         fieldIndex: (parent.fields || []).findIndex(f => f.id === c.data.current.id)
    //   //       },
    //   //       separator: sqlSeparator,
    //   //     });
    //   //   } else if (c.opt === 'delete') {
    //   //     return getTemplateString(codeTemplate.deleteField || getEmptyMessage('deleteField', dataSource, code), {
    //   //       field: c.data,
    //   //       separator: sqlSeparator,
    //   //     });
    //   //   } else if (c.opt === 'update') {
    //   //     return getTemplateString(codeTemplate.updateField || getEmptyMessage('updateField', dataSource, code), {
    //   //       old: c.data.oldData,
    //   //       new: c.data.newData,
    //   //       separator: sqlSeparator,
    //   //     });
    //   //   }
    //   // } else if (c.type === 'index') {
    //   //   // 先删除再创建
    //   //   const [o, p] = c.parent || [];
    //   //   return `${getTemplateString(codeTemplate.deleteIndex || getEmptyMessage('deleteIndex', dataSource, code), {
    //   //     [o.type === 'entity' ? 'entity' : 'view']: {
    //   //       ...o,
    //   //     },
    //   //     separator: sqlSeparator,
    //   //   })}${getTemplateString(codeTemplate.createIndex || getEmptyMessage('createIndex', dataSource, code), {
    //   //     [p.type === 'entity' ? 'entity' : 'view']: {
    //   //       ...p,
    //   //       env: getDefaultEnv(p),
    //   //       indexes: (p.indexes || []).map(i => {
    //   //         return {
    //   //           ...i,
    //   //           fields: (i.fields || []).map(f => {
    //   //             const field = (p.fields || []).filter(ie => f.fieldDefKey === ie.id)[0];
    //   //             return {
    //   //               ...f,
    //   //               fieldDefKey: field?.defKey || '',
    //   //             };
    //   //           })
    //   //         }
    //   //       }),
    //   //     },
    //   //     separator: sqlSeparator,
    //   //   })}`;
    //   // }
    // }).join('\n');
  } catch (e) {
    console.log(e);
    return JSON.stringify(e.message, null, 2);
  }
};
