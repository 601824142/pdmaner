import React, {useState, useEffect, useRef} from 'react';

import {Modal, openModal} from '../modal';
import Button from '../button';
import VersionListCard from './versionListCard';
import { getPrefix } from '../../lib/prefixUtil';
import { checkUpdate } from '../../lib/datasource_version_util';
import './style/index.less';
import VersionEdit from './VersionEdit';
import FormatMessage from '../formatmessage';

const VersionListBar = React.memo((props) => {
  const { prefix, onSelected, getLatelyDataSource, autoSave, projectInfo,
    saveVersion, versionsData, removeVersion } = props;
  const [selectedData, setSelectedData] = useState({});
  const selectedDataRef = useRef({});
  selectedDataRef.current = selectedData;
  const currentPrefix = getPrefix(prefix);
  const getName = (r) => {
    return `${r.data?.defName || r.data.oldData?.defName || r.data?.defKey || r.data.oldData?.defKey
    || r.data.current?.defName || r.data.current?.defKey || ''}`;
  };
  const getChangeMessage = (result) => {
    return result.map((r, i) => {
      return `${i + 1}.${FormatMessage.string({id: `versionData.${r.opt}Data`})}${FormatMessage.string({id: `versionData.${r.type}`})}[${getName(r)}]`;
    });
  };
  const _onDelete = (e, o) => {
    e.stopPropagation();
    Modal.confirm({
      title: FormatMessage.string({id: 'deleteConfirmTitle'}),
      message: FormatMessage.string({id: 'deleteConfirm'}),
      onOk:() => {
        removeVersion('', o);
        onSelected(null);
      },
    });
  };
  const _onSelected = (o, i) => {
    onSelected && onSelected(o, i);
    setSelectedData(o);
  };
  const sortData = versionsData.sort((a, b) => b.date - a.date);
  useEffect(() => {
    const i = versionsData.findIndex(v => v.name === selectedDataRef.current.name);
    onSelected && onSelected(versionsData[i], i);
    setSelectedData(versionsData[i] || {});
  }, [versionsData]);
  const _onCreated = (version) => {
    if (projectInfo) {
      let modal;
      const { result, dataSource } = getLatelyDataSource();
      const defaultMessage = (sortData.length === 0 || !result.status) ? [] :
          getChangeMessage(checkUpdate(dataSource, sortData[0].data));
      const tempVersion = {...version, desc: version?.desc || defaultMessage.join('\n')};
      const onOk = () => {
        if (!tempVersion.name ||
            (version && version.name !== tempVersion.name &&
                versionsData.findIndex(v => v.name === tempVersion.name) > -1)
            || (!version && versionsData.findIndex(v => v.name === tempVersion.name) > -1)) {
          Modal.error({
            title: FormatMessage.string({id: 'versionData.validate'}),
            message: FormatMessage.string({id: 'versionData.validate'}),
          });
        } else if (!result.status) {
          Modal.error({
            title: FormatMessage.string({id: 'versionData.saveError'}),
            message: result.message,
          });
        } else {
          if (!version) {
            tempVersion.date = Date.now();
            tempVersion.data = dataSource;
          }
          autoSave(dataSource);
          saveVersion(tempVersion, version, dataSource, FormatMessage.string({id: 'versionData.saveTitle'})).then(() => {
            modal.close();
          });
        }
      };
      const onCancel = () => {
        modal.close();
      };
      const onChange = (e, name) => {
        tempVersion[name] = e.target.value;
      };
      modal = openModal(<VersionEdit
        data={version}
        onChange={onChange}
        defaultMessage={defaultMessage}
      />, {
        onEnter: onOk,
        focusFirst: true,
        title: FormatMessage.string({id: version ? 'versionData.edit' : 'versionData.add'}),
        buttons: [
          <Button type='primary' key='ok' onClick={onOk}>{FormatMessage.string({id: 'button.ok'})}</Button>,
          <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.cancel'})}</Button>],
      });
    } else {
      Modal.error({
        title: FormatMessage.string({id: 'versionData.isDemo'}),
        message: FormatMessage.string({id: 'versionData.isDemo'}),
      });
    }
  };
  const renderCreatedTool = () => {
    const { result, dataSource } = getLatelyDataSource();
    const changes = result.status ? checkUpdate(dataSource, sortData[0]?.data) : [];
    return (
      <>
        <VersionListCard type="new" onNew={() => _onCreated()}/>
        { result.status && changes.length > 0 && <VersionListCard result={getChangeMessage(changes)} type="warn"/> }
      </>
    );
  };
  const _onEdit = (e, o) => {
    e.stopPropagation();
    _onCreated(o);
  };
  return (
    <div className={`${currentPrefix}-version-list`}>
      {
        sortData.length === 0 ? <div onClick={() => _onCreated()} className={`${currentPrefix}-version-list-empty`}>
          <FormatMessage id='versionData.empty'/>
        </div> : <>
          {renderCreatedTool()}
          { sortData
              .map((o, i) => {
                return (
                  <VersionListCard
                    index={i}
                    key={o.date}
                    version={o}
                    selected={selectedData.date === o.date}
                    onSelected={_onSelected}
                    onDelete={_onDelete}
                    onEdit={_onEdit}
                    prefix={prefix}
                    />
                );
              }) }
        </>
      }
    </div>
  );
});

export default VersionListBar;
