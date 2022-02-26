import React from 'react';

import './style/index.less';
import {Icon} from 'components/index';
import {getPrefix} from '../../lib/prefixUtil';

const VersionListCard = React.memo((props) => {
  const {version, title, info, selected, onDelete, onEdit, type,
    prefix, onNew, onSelected } = props;
  const currentPrefix = getPrefix(prefix);
  const _onSelected = () => onSelected && onSelected({ version, title, info });
  const _onDelete = () => onDelete && onDelete({ version, title, info });
  const _onEdit = () => onEdit && onEdit({ version, title, info });
  const renderVersionHeader = () => {
    if (type === 'new') {
      return (
        <div className={`${currentPrefix}-version-list-card-h-primary`} onClick={onNew}>
          <span />
          <span>{title || '记录新版本'}</span>
          <span />
        </div>
      );
    }
    if (type === 'warn') {
      return (
        <div className={`${currentPrefix}-version-list-card-h-warn`}>
          <span />
          <span>{title || '有了新变化'}</span>
          <span />
        </div>
      );
    }
    return (
      <div className={`${currentPrefix}-version-list-card-h${selected ? '-primary' : ''}`}>
        <span>{version}</span>
        <span>{title}</span>
        <div className={`${currentPrefix}-version-list-card-h-r`}>
          { onDelete && <Icon type='fa-trash' onClick={_onDelete}/> }
          { onEdit && <Icon type='fa-pencil' onClick={_onEdit}/> }
        </div>
      </div>
    );
  };
  const renderVersionDetailPanel = () => {
    if (type === 'warn') {
      return (
        <div className={`${currentPrefix}-version-list-card-panel-warn`}>
          {info || '可以记录新版本了'}
        </div>
      );
    }
    if (info instanceof Array) {
      return (
        <div className={`${currentPrefix}-version-list-card-panel`}>
          {info.map((o, i) => <p key={i}>{o}</p>)}
        </div>
      );
    }
    return null;
  };
  return (
    <div className={`${currentPrefix}-version-list-card`} onClick={_onSelected}>
      {renderVersionHeader()}
      {renderVersionDetailPanel()}
    </div>
  );
});

export default VersionListCard;
