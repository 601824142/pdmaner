import React, {useEffect, useState} from 'react';
import { Button, Icon, openModal, Tree, FormatMessage } from 'components';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, dataSource, data, onChange}) => {
  const [entityRefs, updateEntityRefs] = useState(data?.refEntities || []);
  useEffect(() => {
    const entities = dataSource?.entities || [];
    const tempRefEntities =
      data?.refEntities?.filter(ref => entities.findIndex(e => e.id === ref) > -1) || [];
    updateEntityRefs(tempRefEntities);
    onChange && onChange(tempRefEntities);
  }, [dataSource?.entities?.length]);
  const message = FormatMessage.string({
    id: 'view.selectEntityMessage',
    data: {
      count: entityRefs.length,
    }});
  const currentPrefix = getPrefix(prefix);
  const click = () => {
    let modal = null;
    let tempValue = [...entityRefs];
    const _onChange = (value) => {
      tempValue = value;
    };
    const onOK = () => {
      onChange && onChange(tempValue);
      updateEntityRefs(tempValue);
      modal && modal.close();
    };
    const onCancel = () => {
      modal && modal.close();
    };
    const treeData = [
      {
        key: 'entityList',
        value: FormatMessage.string({id: 'view.entityList'}),
        children: (dataSource?.entities || [])
          .map(e => ({
            key: e.id,
            value: `${e.defKey}-${e.defName}`,
          })),
      },
    ];
    modal = openModal(<div className={`${currentPrefix}-view-entity-select`}>
      <Tree dataSource={treeData} onChange={_onChange} defaultCheckeds={entityRefs}/>
    </div>, {
      title: FormatMessage.string({id: 'view.selectEntity'}),
      buttons: [
        <Button key='onOK' onClick={onOK} type='primary'>
          <FormatMessage id='button.ok'/>
        </Button>,
        <Button key='onCancel' onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>,
      ],
    });
  };
  return (
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'view.selectEntity'})}
      >
        <FormatMessage id='view.selectEntity'/>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <div>
          <span>{message}</span>
          <Icon
            title={FormatMessage.string({id: 'view.selectEntityIcon'})}
            onClick={click}
            type='fa-pencil-square-o'
            className={`${currentPrefix}-entity-base-properties-edit`}
        />
        </div>
      </span>
    </div>
  );
});
