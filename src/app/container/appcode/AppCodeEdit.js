import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import _ from 'lodash/object';
import { moveArrayPositionByFuc } from '../../../lib/array_util';

import {
    SimpleTab,
    FormatMessage,
    Modal,
    openModal,
    Button,
    Input,
    Message,
} from '../../../components';
import { getPrefix } from '../../../lib/prefixUtil';
import './style/index.less';
import CodeEdit from './CodeEdit';

export default React.memo(forwardRef(({style, dataSource, empty,
                                          prefix, updateDataSource}, ref) => {
    const dataSourceRef = useRef(null);
    const currentAppRef = useRef(null);
    dataSourceRef.current = dataSource;
    const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
    const currentPrefix = getPrefix(prefix);
    const [currentApp, setCurrentApp] = useState('');
    currentAppRef.current = currentApp;
    useImperativeHandle(ref, () => {
        return {
            getData(id){
                setCurrentApp(id);
            },
        };
    }, []);
    const current = codeTemplates.filter(c => c.applyFor === currentApp)[0] || {};
    const update = (opt) => {
        updateDataSource({
            ...dataSourceRef.current,
            profile: {
                ...dataSourceRef.current.profile,
                codeTemplates: (dataSourceRef.current.profile.codeTemplates || [])
                    .map((c) => {
                        if (c.applyFor === currentAppRef.current) {
                            return opt(c);
                        }
                        return c;
                    }),
            },
        });
    };
    const onDelete = (key, callback) => {
        Modal.confirm({
            title: FormatMessage.string({id: 'deleteConfirmTitle'}),
            message: FormatMessage.string({id: 'deleteConfirm'}),
            onOk:() => {
                update((c) => {
                    return _.omit(c, key);
                });
                callback();
            },
        });
    };
    const onAdd = (v, callback) => {
        let modal;
        let value = v;
        const onChange = (e) => {
            value = e.target.value;
        };
        const close = () => {
            modal && modal.close();
        };
        const onOk = () => {
            const errorCode = Object.keys((dataSourceRef.current.profile.codeTemplates || [])
                .filter(c => c.applyFor === currentAppRef.current)[0] || {});
            if(!value || errorCode.filter(e => (v ? e !== v : e)).includes(value)) {
                Message.error({title: FormatMessage.string({id: 'appCodeData.validate'})});
            } else {
                update((c) => {
                    if (v) {
                        return Object.keys(c).reduce((p, n) => {
                            return {
                                ...p,
                                [n === v ? value : n]: c[n],
                            };
                        }, {});
                    }
                    return {
                        ...c,
                        [value]: '',
                    };
                });
                callback(value);
                close();
            }
        };
        modal = openModal(<div className={`${currentPrefix}-appcode-add`}>
          <Input defaultValue={value} onChange={onChange} placeholder={FormatMessage.string({id: 'appCodeData.add'})}/>
        </div>, {
            focusFirst: true,
            onEnter: () => {
                onOk();
            },
            title: FormatMessage.string({id: 'appCodeData.type'}),
            buttons: [
              <Button type='primary' key='primary' onClick={onOk}><FormatMessage id='button.ok'/></Button>,
              <Button key='close' onClick={close}><FormatMessage id='button.cancel'/></Button>],
        });
    };
    const onBlur = (e, edit, c) => {
      update((d) => {
          return {
              ...d,
              [c]: edit.getValue(),
          };
      });
    };
    const onTabDoubleClick = (id, callback) => {
        onAdd(id, callback);
    };
    const onPositionChange = (pre, next) => {
        update((d) => {
            const keys = Object.keys(d).filter(c => !['applyFor', 'type'].includes(c));
            return moveArrayPositionByFuc(keys, (k) => {
                return k === pre.key;
            }, keys.findIndex(k => next === k)).reduce((p, n) => {
                return {
                    ...p,
                    [n]: d[n],
                };
            }, {
                applyFor: d.applyFor,
                type: d.type,
            });
        });
    };
    return <div style={style} className={`${currentPrefix}-appcode`}>
      {currentApp && Object.keys(current).length > 0 ? <div className={`${currentPrefix}-appcode-tab`}>
        <SimpleTab
          draggable
          onPositionChange={onPositionChange}
          onTabDoubleClick={onTabDoubleClick}
          key={currentApp}
          onAdd={c => onAdd('', c)}
          //disableEdit='content'
          edit
          onDelete={onDelete}
          className={`${currentPrefix}-database-container-tab`}
          options={Object.keys(current)
              .filter(c => !['applyFor', 'type', 'isDefault'].includes(c)).map((c) => {
                  return {
                      key: c,
                      title: c,
                      content: <CodeEdit
                        prefix={currentPrefix}
                        type={c}
                        name={current.applyFor}
                        data={current[c]}
                        update={update}
                        dataSource={dataSource}
                        onBlur={(e, edit) => onBlur(e, edit, c)}
                      />,
                  };
              })}
            />
      </div> : empty}
    </div>;
}));
