import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import {Input, FormatMessage, Icon, Modal} from 'components';

import {getPrefix} from '../../../lib/prefixUtil';
import {openFileOrDirPath} from '../../../lib/middle';

export default React.memo(forwardRef(({prefix, data, config, template}, ref) => {
    const evnData = data?.evn || {};
    const [evn, setEvn] = useState(evnData.default || {});
    const [templateEvn, setTemplateEvn] = useState(template.map((t) => {
        const tData = evnData.template || {};
        return {
            name: t,
            dir: tData[t]?.dir || '',
            suffix: tData[t]?.suffix || '',
        };
    }));
    const [customerEvn, setCustomerEvn] = useState(() => {
        return Object.keys(evnData.custom || {}).map(e => ({
                id: Math.uuid(),
                name: e,
                value: (evnData.custom || {})[e],
            }));
    });
    const [path, setPath] = useState((config.path || {})[data.id]);
    const evnRef = useRef(null);
    evnRef.current = evn;
    const templateEvnRef = useRef(null);
    templateEvnRef.current = templateEvn;
    const customerEvnRef = useRef(null);
    customerEvnRef.current = customerEvn;
    const pathRef = useRef(null);
    pathRef.current = path;
    useImperativeHandle(ref, () => {
        return {
            getData(){
                return {
                    default: evnRef.current,
                    template: templateEvnRef.current
                        .filter(e => e.dir || e.suffix).reduce((a, b) => {
                        return {
                            ...a,
                            [b.name]: {dir: b.dir, suffix: b.suffix},
                        };
                    }, {}),
                    custom: customerEvnRef.current.filter(e => e.name || e.value).reduce((a, b) => {
                        return {
                            ...a,
                            [b.name]: b.value,
                        };
                    }, {}),
                };
            },
            getPath(){
                return pathRef.current;
            },
        };
    }, []);
    const selectDir = () => {
        openFileOrDirPath([], ['openDirectory']).then((res) => {
            setPath(res);
        }).catch((err) => {
            Modal.error({
                title: FormatMessage.string({id: 'openDirError'}),
                message: err.message || err,
            });
        });
    };
    const onPtahChange = (e) => {
        setPath(e.target.value);
    };
    const onCustomerEvnChange = (value, id, name) => {
        setCustomerEvn(pre => pre.map((p) => {
            if (id === p.id) {
               return {
                   ...p,
                   [name]: value,
               };
            }
            return p;
        }));
    };
    const onEvnChange = (value, name) => {
        setEvn((pre) => {
            return {
                ...pre,
                [name]: value,
            };
        });
    };
    const addEvn = () => {
        setCustomerEvn(pre => pre.concat({
            id: Math.uuid(),
            name: '',
            key: '',
        }));
    };
    const deleteEvn = (id) => {
        setCustomerEvn(pre => pre.filter(p => p.id !== id));
    };
    const templateEvnChange = (value, name, id) => {
        setTemplateEvn(pre => pre.map((p) => {
            if (p.name === id) {
                return {
                    ...p,
                    [name]: value,
                };
            }
            return p;
        }));
    };
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-form`}>
      <div>
        <div className={`${currentPrefix}-datatype-title`}>
          <span>{}</span>
          <span>{FormatMessage.string({id: 'tableBase.baseConfig'})}</span>
        </div>
        <div>
          <div className={`${currentPrefix}-form-item`}>
            <span
              className={`${currentPrefix}-form-item-label`}
              title={FormatMessage.string({id: 'tableBase.savePath'})}>
              {FormatMessage.string({id: 'tableBase.savePath'})}
            </span>
            <span className={`${currentPrefix}-form-item-component`}>
              <Input
                placeholder={FormatMessage.string({id: 'tableBase.savePath'})}
                onChange={onPtahChange}
                value={path}
                suffix={<span className={`${currentPrefix}-setting-java-home-opt`}>
                  <Icon type='fa-ellipsis-h' onClick={selectDir} title={FormatMessage.string({id: 'tableBase.select'})}/>
                </span>}
              />
            </span>
          </div>
          <div className={`${currentPrefix}-form-item`}>
            <span
              className={`${currentPrefix}-form-item-label`}
              title={FormatMessage.string({id: 'tableBase.nameSpace'})}
            >
              <FormatMessage id='tableBase.nameSpace'/>
            </span>
            <span className={`${currentPrefix}-form-item-component`}>
              <Input
                value={evn.nameSpace || ''}
                onChange={e => onEvnChange(e.target.value, 'nameSpace')}
              />
            </span>
          </div>
          <div className={`${currentPrefix}-form-item`}>
            <span
              className={`${currentPrefix}-form-item-label`}
              title={FormatMessage.string({id: 'tableBase.codeRoot'})}
            >
              <FormatMessage id='tableBase.codeRoot'/>
            </span>
            <span className={`${currentPrefix}-form-item-component`}>
              <Input
                value={evn.codeRoot || ''}
                onChange={e => onEvnChange(e.target.value, 'codeRoot')}
              />
            </span>
          </div>
        </div>
      </div>
      <div>
        <div className={`${currentPrefix}-datatype-title`}>
          <span>{}</span>
          <span>{FormatMessage.string({id: 'tableBase.templateConfig'})}</span>
        </div>
        <div className={`${currentPrefix}-entity-template-container`}>
          <div>
            <div>{FormatMessage.string({id: 'tableBase.template'})}</div>
            <div>{FormatMessage.string({id: 'tableBase.dir'})}</div>
            <div>{FormatMessage.string({id: 'tableBase.suffix'})}</div>
          </div>
          {templateEvn.map((t) => {
                return <div key={t.name}>
                  <div>{t.name}</div>
                  <div><Input onChange={e => templateEvnChange(e.target.value, 'dir', t.name)} value={t.dir} placeholder={FormatMessage.string({id: 'tableBase.dirPlaceHolder'})}/></div>
                  <div><Input onChange={e => templateEvnChange(e.target.value, 'suffix', t.name)} value={t.suffix}/></div>
                </div>;
            })}
        </div>
      </div>
      <div>
        <div className={`${currentPrefix}-datatype-title`}>
          <span>{}</span>
          <span>{FormatMessage.string({id: 'tableBase.customEvn'})}</span>
        </div>
        <div className={`${currentPrefix}-entity-evn-container`}>
          {
              customerEvn.map((e) => {
                    return <div className={`${currentPrefix}-entity-evn`} key={e.id}>
                      <Input
                        onChange={ev => onCustomerEvnChange(ev.target.value, e.id, 'name')}
                        value={e.name}
                        />
                      <span style={{margin: '0 10px'}}>=</span>
                      <Input
                        onChange={ev => onCustomerEvnChange(ev.target.value, e.id, 'value')}
                        value={e.value}
                        />
                      <Icon onClick={() => deleteEvn(e.id)} style={{marginLeft: 10}} type='fa-minus'/>
                    </div>;
                })
            }
          <div onClick={addEvn}>
            <Icon type='fa-plus' style={{marginRight: 10}}/>
            <FormatMessage id='tableBase.add'/>
          </div>
        </div>
      </div>
    </div>;
}));
