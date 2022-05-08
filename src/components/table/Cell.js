import React, {useEffect, useRef} from 'react';
import * as _ from 'lodash/object';
import * as Component from 'components/index';
import {emptyDict, getColumnWidth, validateDictBase} from '../../lib/datasource_util';
import DictBase from '../../app/container/dict/DictBase';
import EntityBasePropertiesList from '../../app/container/entity/EntityBasePropertiesList';


export default React.memo(({f, name, remarkChange, onKeyDown, currentPrefix,
                             onChange, onBlur, checkboxComponents, reading, cellRef, dicts,
                             setDict, getDataSource, updateDataSource, entities,
                             openDict, defaultGroups, domains, uiHint}) => {
  const tooltipRef = useRef(null);
  const columnWidth = getColumnWidth();
  const cell = useRef(null);
  useEffect(() => {
    cellRef && cellRef(cell);
  }, []);
  const numberComponents = ['len', 'scale'];
  const openRemark = () => {
    const { Button, openModal } = Component;
    let tempValue = f[name];
    const onOk = (modal) => {
      remarkChange(name, {target: { value: tempValue }});
      modal && modal.close();
    };
    const onCancel = (modal) => {
      modal && modal.close();
    };
    const remarkDetailChange = (e) => {
      tempValue = e.target.value;
    };
    const modal = openModal(<Component.Text
      style={{width: 510, height: 250, marginBottom: 10}}
      defaultValue={f[name]}
      onChange={remarkDetailChange}
    />, {
      title: Component.FormatMessage.string({id: name === 'intro' ? 'dict.item.intro' : 'fieldRemarkDetail'}),
      buttons: [<Button type='primary' key='ok' onClick={() => onOk(modal)}>{Component.FormatMessage.string({id: 'button.ok'})}</Button>,
        <Button key='cancel' onClick={() => onCancel(modal)}>{Component.FormatMessage.string({id: 'button.cancel'})}</Button>],
    });
  };
  const onCreate = () => {
    const { Button, openModal, Modal, FormatMessage } = Component;
    const currentDataSource = getDataSource();
    let dictModal;
    let newDict = {...emptyDict, group: defaultGroups, id: Math.uuid()};
    const dictChange = (dictData, dictName) => {
      if (dictName === 'fields') {
        newDict.items = dictData;
      } else {
        newDict[dictName] = dictData;
      }
    };
    const onOK = () => {
      if (validateDictBase(newDict)
          && !(currentDataSource.dicts || []).map(d => d.defKey).includes(newDict.defKey)) {
        onChange && onChange({
          target: {
            value: newDict.id,
          },
        });
        dictModal && dictModal.close();
        const newDicts = (currentDataSource.dicts || []).concat(_.omit(newDict, 'group'));
        updateDataSource && updateDataSource({
          ...currentDataSource,
          dicts: newDicts,
          viewGroups: (currentDataSource?.viewGroups || []).map((g) => {
            if (newDict.group?.includes(g.id)) {
              return {
                ...g,
                refDicts: [...new Set((g.refDicts || []).concat(newDict.id))],
              };
            }
            return g;
          }),
        });
        setDict(newDicts);
      } else {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'dict.dictAndItemNotAllowRepeatAndEmpty'}),
        });
      }
    };
    const onCancel = () => {
      dictModal && dictModal.close();
    };
    dictModal = openModal(<div style={{height: '70vh'}}>
      <DictBase
        defaultGroups={defaultGroups}
        dataSource={currentDataSource}
        dictData={emptyDict}
        dictChange={dictChange}
      />
    </div>, {
      title: FormatMessage.string({id: 'dict.create'}),
      width: '80%',
      bodyStyle: {width: '80%'},
      buttons: [
        <Button type='primary' key='ok' onClick={onOK}>{FormatMessage.string({id: 'button.ok'})}</Button>,
        <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.cancel'})}</Button>],
    });
  };
  const viewDict = () => {
    const { Table, Button } = Component;
    const data = (dicts || [])?.filter(d => d.id === f[name])[0];
    if (data) {
      const onOk = () => {
        tooltipRef.current.setTooltipVisible(false);
        openDict(data.id, 'dict', null, 'dict.svg');
      };
      return <div className={`${currentPrefix}-table-dict-items`}>
        <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
          <Table
            disableDragRow
            disableHeaderSort
            disableHeaderIcon
            customerHeaders
            reading
            data={{
                headers: ['defKey', 'defName', 'intro', 'enabled'].map(i => ({
                  refKey: i,
                  value: Component.FormatMessage.string({id: `dict.item.${i}`}),
                })),
                fields: data?.items || [],
              }}
          />
        </div>
        <Button key='ok' onClick={() => onOk()}>{Component.FormatMessage.string({id: 'button.edit'})}</Button>
      </div>;
    }
    return '';
  };
  const openExtProps = (properties) => {
    let drawer;
    let changeProperties = {...properties};
    const { Button, openDrawer, FormatMessage } = Component;
    const onOK = () => {
      onChange && onChange({
        target: {
          value: changeProperties,
        },
      });
      drawer.close();
    };
    const onCancel = () => {
      drawer.close();
    };
    const propertiesChange = (changeData) => {
      changeProperties = changeData;
    };
    drawer = openDrawer(<EntityBasePropertiesList
      className={`${currentPrefix}-entity-base-properties-field`}
      properties={properties}
      propertiesChange={propertiesChange}
    />, {
      title: FormatMessage.string({id: 'tableHeaders.ext'}),
      width: '55%',
      buttons: [
        <Button key='onSave' onClick={onOK} type='primary'>
          <FormatMessage id='button.save'/>
        </Button>,
        <Button key='onCancel' onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>,
      ],
    });
  };
  if (reading) {
    const width = columnWidth[name];
    let label = f[name] || '';
    if (name === 'enabled' || name === 'isStandard') {
      label = label ? Component.FormatMessage.string({id: 'dict.enabled'})
          : Component.FormatMessage.string({id: 'dict.disabled'});
    } else if (name === 'refEntity') {
      label = entities.filter(e => e.id === f[name])[0]?.defKey || '';
    }
    return <Component.Tooltip title={label}>
      <span
        style={{width: width ? (width - 3) : '100%'}}
        className={`${currentPrefix}-table-reading`}
      >{label}</span>
    </Component.Tooltip>;
  } else if (name === 'domain') {
    return <Component.Select value={f[name]} onChange={onChange}>
      {domains.map(d =>
        (<Component.Select.Option
          key={d.id}
          value={d.id}
        >
          {d.defName || d.defKey}
        </Component.Select.Option>))}
    </Component.Select>;
  } else if(name === 'uiHint') {
    return <Component.Select value={f[name]} onChange={onChange}>
      {uiHint.map(d =>
        (<Component.Select.Option
          key={d.id}
          value={d.id}
        >
          {d.defName || d.defKey}
        </Component.Select.Option>))}
    </Component.Select>;
  } else if(name === 'codeType') {
    return <Component.Select value={f[name]} onChange={onChange}>
      <Component.Select.Option
        key='dbDDL'
        value='dbDDL'
      >
        {Component.FormatMessage.string({id: 'codeType.dbDDL'})}
      </Component.Select.Option>
      <Component.Select.Option
        key='appCode'
        value='appCode'
      >
        {Component.FormatMessage.string({id: 'codeType.appCode'})}
      </Component.Select.Option>
    </Component.Select>;
  } if (checkboxComponents.includes(name)) {
    return <Component.Checkbox checked={!!f[name]} onChange={onChange}/>;
  } else if (name === 'hideInGraph') {
    let type = 'fa-eye';
    if (f[name]) {
      type = 'fa-eye-slash';
    }
    return <Component.Icon
      type={type}
      onClick={() => onChange({target: { value: !f[name]}})}/>;
  } else if (numberComponents.includes(name)) {
    return <Component.NumberInput value={f[name]} onChange={onChange}/>;
  } else if (name === 'intro' || name === 'comment') {
    return <Component.Input
      onKeyDown={onKeyDown}
      ref={cell}
      onChange={onChange}
      value={f[name]}
      suffix={<span style={{padding: '0 5px', display: 'inline-block', height: '100%'}} onClick={openRemark}>
        <Component.Icon type='fa-ellipsis-h'/>
      </span>}
    />;
  } else if (name === 'refDict') {
    return <div className={`${currentPrefix}-table-dict`}>
      <Component.MultipleSelect
        dropdownRender={menus => <div>
          {menus}
          <span
            onClick={onCreate}
            className={`${currentPrefix}-table-dict-create`}
            >
            {Component.FormatMessage.string({id: 'dict.create'})}
          </span>
        </div>}
        onChange={values => onChange({
            target: {
              value: values[0] || '',
            },
          })}
        checkValue={[f[name]]}
        simple
      >
        {
          dicts.map(v => (
            <Component.MultipleSelect.Option
              key={v.id}
              value={v.id}>{`${v.defKey}(${v.defName || v.defKey})`}
            </Component.MultipleSelect.Option>))
        }
      </Component.MultipleSelect>
      <Component.Tooltip ref={tooltipRef} visible={f[name]} title={viewDict()} force placement='topLeft'>
        <span
          className={`${currentPrefix}-table-dict-view-${(dicts || [])?.filter(d => d.id === f[name])[0] ? 'normal' : 'disabled'}`}
        >
          {Component.FormatMessage.string({id: 'dict.view'})}
        </span>
      </Component.Tooltip>
    </div>;
  } else if (name === 'ascOrDesc') {
    return <Component.Select value={f[name]} onChange={onChange}>
      {[{key: 'A', name: 'ASC'}, {key: 'D', name: 'DESC'}].map(d =>
          (<Component.Select.Option
            key={d.key}
            value={d.key}
          >
            {d.name}
          </Component.Select.Option>))}
    </Component.Select>;
  } else if (name === 'extProps') {
    return <a style={{textAlign: 'center', display: 'inline-block', width: '100%'}} onClick={() => openExtProps(f[name] || {})}>
      <span><Component.FormatMessage id='tableHeaders.ext'/></span><span style={{marginLeft: 5}}>{Object.keys(f[name] || {}).length || ''}</span>
    </a>;
  }
  return <Component.Input
    onKeyDown={onKeyDown}
    ref={cell}
    value={f[name]}
    onChange={onChange}
    onBlur={onBlur}
  />;
}, (pre, next) => {
  if (pre.name === 'domain') {
    return !((pre?.domains !== next?.domains)
      || (pre.f[pre.name] !== next.f[next.name]));
  } else if (pre.name === 'refDict') {
    return !((pre?.dicts !== next?.dicts)
        || (pre.f[pre.name] !== next.f[next.name]));
  } else if (pre.name === 'uiHint') {
    return !((pre?.uiHint !== next?.uiHint)
      || (pre.f[pre.name] !== next.f[next.name]));
  } else if (pre.name === 'refEntity') {
    return pre?.entities === next?.entities;
  }
  return pre.f[pre.name] === next.f[next.name];
});
