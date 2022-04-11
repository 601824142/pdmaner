import React, {useState, useEffect, useRef} from 'react';

import {Modal, openModal} from '../modal';
import Button from '../button';
import VersionListCard from './versionListCard';
import { getPrefix } from '../../lib/prefixUtil';
import {getMessageByChanges, packageChanges, getMaxVersion} from '../../lib/datasource_version_util';
import './style/index.less';
import VersionEdit from './VersionEdit';
import FormatMessage from '../formatmessage';

const VersionListBar = React.memo((props) => {
  const { prefix, onSelected, getLatelyDataSource, autoSave, projectInfo,
    saveVersion, versionsData, removeVersion, menuType } = props;
  const [selectedData, setSelectedData] = useState({});
  const selectedDataRef = useRef({});
  selectedDataRef.current = selectedData;
  const currentPrefix = getPrefix(prefix);
  const _onDelete = (e, o) => {
    e.stopPropagation();
    Modal.confirm({
      title: FormatMessage.string({id: 'deleteConfirmTitle'}),
      message: FormatMessage.string({id: 'deleteConfirm'}),
      onOk:() => {
        removeVersion('', o);
        onSelected({});
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
  useEffect(() => {
    if (menuType === '4') {
      if(selectedDataRef.current) {
        onSelected && onSelected(selectedDataRef.current,
            versionsData.findIndex(v => v.date === selectedDataRef.current.date));
       // onSelected && onSelected(o, i);
      }
    }
  }, [menuType]);
  const _onCreated = (version) => {
    if (projectInfo) {
      let modal;
      const { result, dataSource } = getLatelyDataSource();
      const tempVersion = {
        ...version,
        name: version?.name || getMaxVersion(sortData),
        desc: version?.desc || ((sortData.length === 0 || !result.status) ? [] :
            getMessageByChanges(packageChanges(dataSource, sortData[0].data), dataSource))};
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
        data={tempVersion}
        onChange={onChange}
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
    const changes = result.status ? packageChanges(dataSource, sortData[0]?.data) : [];
    return (
      <>
        <VersionListCard type="new" onNew={() => _onCreated()}/>
        { result.status && changes.length > 0 && <VersionListCard onSelected={_onSelected} type="warn"/> }
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
