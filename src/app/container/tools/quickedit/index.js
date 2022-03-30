import React from 'react';
import {FormatMessage, Input} from 'components';

import {getPrefix} from '../../../../lib/prefixUtil';
import { allType } from '../../../../lib/datasource_util';
import SelectGroup from '../../group/SelectGroup';
import './style/index.less';

export default React.memo(({ prefix, dataSource, dataChange, dataType }) => {
    const name = allType.filter(t => t.type === dataType)[0]?.name || dataType;
    const currentPrefix = getPrefix(prefix);
    const refNames = `ref${name.replace(/\b(\w)(\w*)/g, ($0, $1, $2) => {
        return $1.toUpperCase() + $2.toLowerCase();
    })}`;
    const getGroup = (dataKey) => {
        return (dataSource?.viewGroups || [])
            .filter(v => v[refNames]
                ?.includes(dataKey))
            .map(v => v.id);
    };
    const _dataChange = (value, fieldName, id) => {
      if (fieldName === 'group') {
          dataChange && dataChange({
              ...dataSource,
              viewGroups: (dataSource.viewGroups || []).map((d) => {
                  if (value.includes(d.id)) {
                      return {
                          ...d,
                          [refNames]: [...new Set(d[refNames].concat(id))],
                      };
                  }
                  return d;
              }),
          });
      } else {
          dataChange && dataChange({
              ...dataSource,
              [name]: (dataSource[name] || []).map((d) => {
                  if (d.id === id) {
                      return {
                          ...d,
                          [fieldName]: value,
                      };
                  }
                  return d;
              }),
          });
      }
    };
    return <div className={`${currentPrefix}-quick-edit`}>
      <table>
        <thead>
          <th>{}</th>
          <th>{FormatMessage.string({id: 'tableBase.defKey'})}</th>
          <th>{FormatMessage.string({id: 'tableBase.defName'})}</th>
          <th>{FormatMessage.string({id: 'tableBase.comment'})}</th>
          <th>{FormatMessage.string({id: 'tableBase.group'})}</th>
        </thead>
        <tbody>
          {
                (dataSource[name] || []).map((d, i) => {
                    return <tr key={d.id} className={`${currentPrefix}-quick-edit-item`}>
                      <td>{i + 1}</td>
                      <td>
                        <Input placeholder={FormatMessage.string({id: 'tableBase.defKey'})} defaultValue={d.defKey} onChange={e => _dataChange(e.target.value, 'defKey', d.id)}/>
                      </td>
                      <td>
                        <Input defaultValue={d.defName} onChange={e => _dataChange(e.target.value, 'defName', d.id)}/>
                      </td>
                      <td>
                        <Input defaultValue={d[name === 'dicts' ? 'intro' : 'comment']} onChange={e => _dataChange(e.target.value, name === 'dicts' ? 'intro' : 'comment', d.id)}/>
                      </td>
                      <td>
                        <SelectGroup
                          hiddenLabel
                          dataSource={dataSource}
                          dataChange={(...args) => _dataChange(...args, d.id)}
                          data={getGroup(d.id)}
                        />
                      </td>
                    </tr>;
                })
            }
        </tbody>
      </table>
    </div>;
});
