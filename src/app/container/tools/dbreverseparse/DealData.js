import React, {useRef, useImperativeHandle, forwardRef, useState} from 'react';
import _ from 'lodash/object';

import { ListGroupSelect, FormatMessage } from 'components';
import {getPrefix} from '../../../../lib/prefixUtil';

export default React.memo(forwardRef(({getData, dataSource, prefix}, ref) => {
  const listGroupSelectRef = useRef(null);
  const currentPrefix = getPrefix(prefix);
  const entities = dataSource.entities || [];
  const pickName = ['defKey', 'defName', 'id'];
  const viewGroups = (dataSource.viewGroups || []).map((g) => {
    return {
      ..._.pick(g, pickName),
      fields: [],
    };
  });
  const formatResult = (data, exist) => {
    return FormatMessage.string({
      id: 'dbReverseParse.dealResult',
      data: {
        data: data?.length || 0,
        exists: exist?.length || 0,
      }});
  };
  const calcData = () => {
    return [{
      id: '',
      defKey: '',
      defName: FormatMessage.string({id: 'components.select.empty'}),
      fields: (getData().data || []).map(e => ({
        ...e,
        id: Math.uuid(),
      })),
    }];
  };
  const [data, setData] = useState(calcData);
  const refresh = () => {
    setData(calcData());
  };
  useImperativeHandle(ref, () => {
    return {
      getData: listGroupSelectRef.current.getData,
      refresh,
    };
  }, []);
  return <div className={`${currentPrefix}-dbreverseparse-db-deal-data`}>
    <ListGroupSelect
      ref={listGroupSelectRef}
      formatResult={formatResult}
      data={data}
      arrayData={entities}
      groups={viewGroups}
    />
  </div>;
}));
