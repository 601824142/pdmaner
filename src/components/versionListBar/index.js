import React, {useState, useEffect} from 'react';

import VersionListCard from './versionListCard';
import { getPrefix } from '../../lib/prefixUtil';
import './style/index.less';

const dataTmp = [
  { version: 'V1.0', title: '123', info: ['1, 用户表增加多账户支持', '2. 流程实力表整理'] },
  { version: 'V1.1', title: '1423', info: ['1, 用户表增加多账户支持', '2. 流程实力表整理'] },
  { version: 'V1.2', title: '2423', info: ['1, 用户表增加多账户支持', '2. 流程实力表整理'] },
  { version: 'V1.3', title: '3423', info: ['1, 用户表增加多账户支持', '2. 流程实力表整理'] },
  { version: 'V1.4', title: '4423', info: ['1, 用户表增加多账户支持', '2. 流程实力表整理'] },
];

const VersionListBar = React.memo((props) => {
  const { prefix, onDelete, onEdit, onSelected, onCreated, enableNew = false } = props;
  const [data, setData] = useState(dataTmp);
  const [selectedData, setSelectedData] = useState({});
  useEffect(() => setData(props.data), [JSON.stringify(props.data)]);
  const currentPrefix = getPrefix(prefix);
  const _onDelete = (o) => {
    const result = onDelete && onDelete(o);
    if(result === false) return;
    setData(data.filter(obj => obj.version !== o.version));
  };
  const _onSelected = (o) => {
    onSelected && onSelected(o);
    setSelectedData(o);
  };

  const _onCreated = () => {
    const result = onCreated && onCreated();
    if (!(result instanceof Object)) return;
    setData(data.concat(result));
  };
  const renderCreatedTool = () => {
    if (enableNew) {
      return (
        <>
          <VersionListCard type="new" onNew={_onCreated}/>
          <VersionListCard type="warn" info="可以记录新版本了！" />
        </>
      );
    }
    return null;
  };
  const _onEdit = (o) => {
    const result = onEdit && onEdit(o);
    if(result === false) return;
    setData(data.map((obj) => {
      if (obj.version === o.version) {
        return obj;
      }
      return o;
    }));
  };
  return (
    <div className={`${currentPrefix}-version-list`}>
      {renderCreatedTool()}
      { data.map((o, i) => {
        const { title, version, info } = o;
        return (
          <VersionListCard
            key={i}
            version={version}
            title={title}
            info={info}
            selected={selectedData.version === version}
            onSelected={_onSelected}
            onDelete={_onDelete}
            onEdit={_onEdit}
            prefix={prefix}
          />
        );
      }) }
    </div>
  );
});

VersionListBar.defaultProps = {
  data: dataTmp,
};

export default VersionListBar;
