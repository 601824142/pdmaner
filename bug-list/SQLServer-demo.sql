--改表信息
EXEC sp_rename 'SIMS_LESSON_CLOCK','SIMS_LESSON_CLOCK_N';
IF ((SELECT COUNT(*) FROM ::fn_listextendedproperty('MS_Description','SCHEMA', 'dbo','TABLE', 'SIMS_LESSON_CLOCK_N', NULL, NULL)) > 0)
	EXEC sp_updateextendedproperty 'MS_Description', '课程打卡N;NEW_N','SCHEMA', 'dbo','TABLE', 'SIMS_LESSON_CLOCK_N'
ELSE
	EXEC sp_addextendedproperty 'MS_Description', '课程打卡N;NEW_N', 'SCHEMA', 'dbo','TABLE', 'SIMS_LESSON_CLOCK_N'             ;

--改字段
EXEC sp_rename '[dbo].[MY_TABLE_1].[F1]', 'F1x', 'COLUMN';
EXEC sp_rename '[dbo].[MY_TABLE_1].[F2]', 'F2x', 'COLUMN';
ALTER TABLE [dbo].[MY_TABLE_1] ALTER COLUMN [F1x] varchar(90) NOT NULL;
ALTER TABLE [dbo].[MY_TABLE_1] ADD DEFAULT 'ddd' FOR [F2x]

--加字段
ALTER TABLE [dbo].[MY_TABLE_1] ADD [F1] varchar(255) DEFAULT 'DF1' ;
ALTER TABLE [dbo].[MY_TABLE_1] ADD [F2] varchar(255) ;
--删字段
ALTER TABLE [dbo].[MY_TABLE_1] DROP COLUMN [F1];
ALTER TABLE [dbo].[MY_TABLE_1] DROP COLUMN [F2];
--字段注释
IF ((SELECT COUNT(*) FROM ::fn_listextendedproperty('MS_Description','SCHEMA', N'dbo','TABLE', N'MY_TABLE_1','COLUMN', N'F1')) > 0)
  EXEC sp_updateextendedproperty 'MS_Description', N'说明1x','SCHEMA', N'dbo','TABLE', N'MY_TABLE_1','COLUMN', N'F1'
ELSE
  EXEC sp_addextendedproperty 'MS_Description', N'说明1x','SCHEMA', N'dbo','TABLE', N'MY_TABLE_1','COLUMN', N'F1'
;
