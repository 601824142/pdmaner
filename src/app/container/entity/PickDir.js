import React, { useState } from 'react';
import {FormatMessage, SearchInput} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({dataSource, config, prefix, onSelected}) => {
    const currentPrefix = getPrefix(prefix);
    //const keys = Object.keys(config.path);
    const [id, setId] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const _onSelected = (r, p) => {
        setId(r.id);
        onSelected && onSelected(r, p);
    };
    const onChange = (e) => {
        setSearchValue(e.target.value);
    };
    const reg = new RegExp((searchValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    return <div className={`${currentPrefix}-entity-template-pickdir`}>
      <div className={`${currentPrefix}-entity-template-pickdir-search`}>
        <SearchInput
          value={searchValue}
          placeholder={FormatMessage.string({id: 'tableBase.search'})}
          onChange={onChange}
        />
      </div>
      <div className={`${currentPrefix}-entity-template-pickdir-container`}>
        <table>
          <thead>
            <tr>
              <td>{}</td>
              <td>{FormatMessage.string({id: 'tableBase.table'})}</td>
              <td>{FormatMessage.string({id: 'tableBase.savePath'})}</td>
            </tr>
          </thead>
          <tbody>
            {(dataSource.entities || [])
                    .concat(dataSource.views || [])
                    .filter(d => reg.test(d.defKey) || reg.test(d.defName))
                    .map((d, i) => {
                        return <tr onClick={() => _onSelected(d, config.path[d.id])} className={id === d.id ? `${currentPrefix}-entity-template-pickdir-selected` : ''} style={{padding: 5}} key={d.id}>
                          <td>{i + 1}</td>
                          <td>{d.defKey || d.defName}[{d.defName}]</td>
                          <td>{config.path[d.id]}</td>
                        </tr>;
                    })}
          </tbody>
        </table></div>
    </div>;
});
