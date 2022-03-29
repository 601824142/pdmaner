import React from 'react';
import moment from 'moment';

import './style/index.less';
import Icon from '../icon';
import {getPrefix} from '../../lib/prefixUtil';
import FormatMessage from '../formatmessage';

const VersionListCard = React.memo((props) => {
  const {version, selected, onDelete, onEdit, type, index,
    prefix, onNew, onSelected, result = [] } = props;
  const currentPrefix = getPrefix(prefix);
  const _onSelected = () => onSelected && onSelected(version, index);
  const _onDelete = e => onDelete && onDelete(e, version);
  const _onEdit = e => onEdit && onEdit(e, version);
  const renderVersionHeader = () => {
    if (type === 'new') {
      return (
        <div className={`${currentPrefix}-version-list-card-h-primary`} onClick={onNew}>
          <span />
          <span style={{cursor: 'pointer'}}>
            <FormatMessage id='versionData.addNew'/>
          </span>
          <span />
        </div>
      );
    }
    if (type === 'warn') {
      return (
        <div onClick={() => onSelected({result: result}, -1)} className={`${currentPrefix}-version-list-card-h-warn`} style={{cursor: 'pointer'}}>
          <span />
          <span><FormatMessage id='versionData.hasNew'/></span>
          <span />
        </div>
      );
    }
    return (
      <div className={`${currentPrefix}-version-list-card-h${selected ? '-primary' : ''}`} onClick={_onSelected}>
        <span>{version.name}</span>
        <span>{moment(version.date).format('YYYY-M-D HH:mm')}</span>
        <div className={`${currentPrefix}-version-list-card-h-r`}>
          { onDelete && index === 0 && <Icon style={{cursor: 'pointer'}} type='fa-trash' onClick={_onDelete}/> }
          { onEdit && <Icon type='fa-pencil' style={{cursor: 'pointer'}} onClick={_onEdit}/> }
        </div>
      </div>
    );
  };
  const renderVersionDetailPanel = () => {
    if (type === 'warn') {
      return (
        <div className={`${currentPrefix}-version-list-card-panel-warn`}>
          <div style={{width: '100%'}}>
            <div><FormatMessage id='versionData.useNew'/></div>
            <div style={{width: '100%'}}>
              {result.map((d, i) => <div className={`${currentPrefix}-version-list-change`} key={i}>{i + 1}.{d}</div>)}
            </div>
          </div>
        </div>
      );
    } else if(type === 'new') {
        return null;
    }
      return (
        <div className={`${currentPrefix}-version-list-card-panel`}>
          {version?.desc?.split('\n')?.map(d => <div className={`${currentPrefix}-version-list-change`} key={d}>{d}</div>)}
        </div>
      );
  };
  return (
    <div className={`${currentPrefix}-version-list-card`}>
      {renderVersionHeader()}
      {renderVersionDetailPanel()}
    </div>
  );
});

export default VersionListCard;
