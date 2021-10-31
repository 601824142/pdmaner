import React from 'react';

import {Button, openModal, Tree, Modal, FormatMessage, IconTitle} from 'components';
import { separator } from '../../../../profile';
import { importFields } from '../../../lib/datasource_util';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, dataSource, data, onChange, getRestData}) => {
  const currentPrefix = getPrefix(prefix);
  const onClick = () => {
    const tempData = {
      ...data,
      ...getRestData(),
    };
    const refEntities = tempData?.refEntities || [];
    const defaultFields = (tempData?.fields || [])
      .filter(f => f.refEntity)
      .map(f => `${f.refEntity}${separator}${f.refEntityField}`);
    let selectedFields = [...defaultFields];
    const _onChange = (value) => {
      selectedFields = value;
    };
    if (refEntities.length === 0) {
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: FormatMessage.string({id: 'view.emptyEntityRefs'}),
      });
    } else {
      const entityRefsData =
        dataSource?.entities?.filter(e => refEntities.includes(e.id)) || [];
      let modal = null;
      const onOK = () => {
        // 获取所有导入的字段
        // 先移除所有导入的字段
        const tempDataFields = tempData.fields?.filter(f => refEntities.includes(f.refEntity));
        const allNewFields = importFields(entityRefsData,
          selectedFields, {fields: tempDataFields},
          false, true);
        onChange && onChange(allNewFields);
        modal && modal.close();
      };
      const onCancel = () => {
        modal && modal.close();
      };
      modal = openModal(<div className={`${currentPrefix}-view-import-fields`}>
        <Tree
          defaultCheckeds={defaultFields}
          dataSource={entityRefsData.map(e => ({
            key: e.id,
            value: `${e.defKey}-${e.defName}`,
            children: (e?.fields || []).map(f => ({key: `${e.id}${separator}${f.id}`, value: `${f.defKey}-${f.defName}`})),
          }))}
          onChange={_onChange}
        />
      </div>, {
        title: FormatMessage.string({id: 'view.importFields'}),
        buttons: [
          <Button key='onOK' onClick={onOK} type='primary'>
            <FormatMessage id='button.ok'/>
          </Button>,
          <Button key='onCancel' onClick={onCancel}>
            <FormatMessage id='button.cancel'/>
          </Button>,
        ],
      });
    }
  };
  return <IconTitle onClick={onClick} type='fa-hand-lizard-o' title={FormatMessage.string({id: 'tableEdit.importFields'})}/>;
});
