export const ADVICES: any = {
  MISS_WHERE_CLAUSE_WITH_AP_FUC:
    'SQL语句中缺少了where条件，如果是正常的业务SQL，可以通过TiFlash来加速。TiFlash配置见命令',
  MISS_WHERE_CLAUSE_WITHOUT_AP_FUC:
    'SQL语句中缺少了where条件，添加合适的过滤条件',
  MISS_INDEX: '缺少合适的索引，请参考建议语句进行索引创建。以提高SQL执行速度',
  FOUND_EXSTING_INDEX: 'SQL语句已经最优',
  SQL_CAN_NOT_PARSE_NEED_SUPPORT:
    'SQL语句太过复杂，建议联系DBA对SQL语句进行人工优化'
}
