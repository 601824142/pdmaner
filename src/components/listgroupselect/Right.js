import React, {useEffect, useState} from 'react';
import {Select, FormatMessage, Checkbox, IconTitle, openModal, Button, Modal, Icon} from 'components';

const Option = Select.Option;

const Item = React.memo(({prefix, d, onGroupChange, defaultSelected,
                           allowClear, notAllowEmpty, currentGroup, i, checked,
                           checkBoxChange, group}) => {
  return <tr
    className={`${prefix}-listselect-right-item`}
    key={d.id}
  >
    <td>{i + 1}</td>
    <td>
      {defaultSelected.includes(d.id) &&
      <Icon
        className={`${prefix}-listselect-right-item-disable`}
        title={FormatMessage.string({id: 'components.listSelect.disable'})}
        type='icon-xinxi'
      />}
      <Checkbox
        onChange={e => checkBoxChange(e, d.id)}
        checked={checked.includes(d.id)}
      >
        <span>
          {`${d.defKey}[${d.defName || d.defKey}]`}
        </span>
      </Checkbox>
    </td>
    <td>
      <Select
        allowClear={allowClear}
        value={group}
        notAllowEmpty={notAllowEmpty}
        onChange={e => onGroupChange(e, d.id)}
      >
        {
          currentGroup.map((g) => {
            return <Option value={g.id} key={g.id}>
              {`${g.defName}${g.defKey ? `(${g.defKey})` : ''}`}
            </Option>;
          })
        }
      </Select>
    </td>
  </tr>;
}, (pre, next) => {
  return ((pre.checked.includes(pre.d.id) && next.checked.includes(next.d.id)) ||
    (!pre.checked.includes(pre.d.id) && !next.checked.includes(next.d.id))) &&
    (pre.group === next.group);
});

export default React.memo(({prefix, newData, onRemove, allowClear,
                             onGroupChange, notAllowEmpty, currentGroup, defaultSelected}) => {
  const [checked, setChecked] = useState([]);
  const [dataGroup, setDataGroup] = useState([]);
  const _onGroupChange = (e, key) => {
    const keys = [].concat(key);
    setDataGroup((pre) => {
      return pre.map((f) => {
        if (keys.includes(f.id)) {
          return {
            ...f,
            group: e.target.value,
          };
        }
        return f;
      });
    });
    onGroupChange && onGroupChange(e, keys);
  };
  const checkBoxChange = (e, key) => {
    setChecked((pre) => {
      if (!e.target.checked) {
        return pre.filter(p => p !== key);
      }
      return pre.concat(key);
    });
  };
  const onPicker = () => {
    let modal;
    let group = '';
    const currentChange = (e) => {
      group = e.target.value;
    };
    const onOK = () => {
      if (!group) {
        if (!currentGroup.some(g => g.id === '')) {
          Modal.error({
            title: FormatMessage.string({id: 'components.listSelect.groupNotAllowEmpty'}),
            message: FormatMessage.string({id: 'components.listSelect.groupNotAllowEmpty'}),
          });
        } else {
          _onGroupChange({
            target: {
              value: group,
            },
          }, checked);
          modal && modal.close();
        }
      } else {
        _onGroupChange({
          target: {
            value: group,
          },
        }, checked);
        modal && modal.close();
      }
    };
    const onCancel = () => {
      modal && modal.close();
    };
    modal = openModal(<div className={`${prefix}-listselect-pick-group`}>
      <Select
        defaultValue=''
        allowClear={allowClear}
        notAllowEmpty={notAllowEmpty}
        onChange={e => currentChange(e, checked)}
      >
        {
          currentGroup.map((g) => {
            return <Option value={g.id} key={g.id}>
              {`${g.defName}${g.defKey ? `(${g.defKey})` : ''}`}
            </Option>;
          })
        }
      </Select>
    </div>, {
      title: FormatMessage.string({id: 'components.listSelect.group'}),
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
  useEffect(() => {
    setChecked(pre => pre.filter(p => newData.findIndex(d => d.id === p) > -1));
  }, [newData]);
  useEffect(() => {
    setDataGroup((pre) => {
      return newData.map((f) => {
        const current = pre.filter(p => p.id === f.id)[0];
        if (current) {
          return {
            ...f,
            group: current.group,
          };
        }
        return f;
      });
    });
  }, [newData]);
  const _iconClick = (t) => {
    if (t === 'all') {
      setChecked([...defaultSelected || []]);
    } else {
      setChecked(() => {
        return [...newData.map(d => d.id)];
      });
    }
  };
  const calcType = () => {
    if (checked.length === newData.length) {
      return 'all';
    } else if (checked.length === 0) {
      return 'normal';
    }
    return 'ind';
  };
  const finalType = calcType();
  return <div className={`${prefix}-listselect-right`}>
    <div className={`${prefix}-listselect-right-opt`}>
      {
        newData.length > 0 && <span className={`${prefix}-listselect-right-opt-selected`} onClick={() => _iconClick(finalType)}>
          <span className={`${prefix}-listselect-opt-${finalType}`}>
            {}
          </span>
          <span>
            {FormatMessage.string({id: 'components.listSelect.all'})}
          </span>
        </span>
      }
      <IconTitle
        disable={checked.filter(c => !defaultSelected.includes(c)).length === 0}
        title={FormatMessage.string({id: 'components.listSelect.remove'})}
        type='fa-minus'
        onClick={() => onRemove(checked.filter(c => !defaultSelected.includes(c)))}
      />
      <IconTitle
        disable={checked.length === 0}
        title={FormatMessage.string({id: 'components.listSelect.group'})}
        type='fa-object-group'
        onClick={onPicker}
      />
    </div>
    <div className={`${prefix}-listselect-right-container`}>
      {
          newData.length === 0 ? <div className={`${prefix}-listselect-right-empty`}>
            <span>
              {FormatMessage.string({id: 'components.listSelect.empty'})}
            </span>
          </div>
              : <table><tbody>
                {newData.filter(d => !!d.defKey).map((d, i) => {
                const group = dataGroup.filter(dg => dg.id === d.id)[0]?.group || '';
                return <Item
                  checkBoxChange={checkBoxChange}
                  checked={checked}
                  defaultSelected={defaultSelected}
                  i={i}
                  allowClear={allowClear}
                  notAllowEmpty={notAllowEmpty}
                  onGroupChange={_onGroupChange}
                  prefix={prefix}
                  key={`${d.id}${i}`}
                  d={d}
                  currentGroup={currentGroup}
                  onRemove={onRemove}
                  group={group}
                />;
              })}
              </tbody></table>
        }
    </div>
  </div>;
});
