import React, {useEffect, useMemo, useRef, useState} from 'react';

import { Copy } from '../../lib/event_tool';
import FormatMessage from '../formatmessage';
import CodeEditor from '../codeeditor';
import DropDown from '../dropdown';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import {addDomResize, removeDomResize} from '../../lib/listener';

export default React.memo(({data, style, prefix, mode = 'sql'}) => {
  const [size, setSize] = useState({});
  const id = useMemo(() => Math.uuid(), []);
  const editorRef = useRef(null);
  const currentPrefix = getPrefix(prefix);
  const valueRef = useRef(null);
  const dropMenu = [
    { key: 'copy', name: FormatMessage.string({id: 'menus.opt.copy'})},
    { key: 'copyAll', name: FormatMessage.string({id: 'menus.opt.copyAll'})},
  ];
  const menuClick = (m) => {
    let copyData;
    if (m.key === 'copy') {
      copyData = valueRef.current?.session?.getTextRange(valueRef.current?.getSelectionRange()) || '';
    } else {
      copyData = valueRef.current?.getValue();
    }
    Copy(copyData, FormatMessage.string({id: 'copySuccess'}));
  };
  const onLoad = (ace) => {
    valueRef.current = ace;
  };
  const filterMenus = (m) => {
    if (valueRef.current?.session?.getTextRange(valueRef.current?.getSelectionRange())) {
      return m;
    }
    return m.key === 'copyAll';
  };
  useEffect(() => {
    addDomResize(editorRef.current, id, () => {
      setSize({
        width: `${editorRef.current.clientWidth}px`,
        height: `${editorRef.current.clientHeight}px`,
      });
    });
    return () => {
      removeDomResize(editorRef.current, id);
    };
  }, []);
  return (<div ref={editorRef} style={style} className={`${currentPrefix}-code-highlight`}>
    <DropDown
      filterMenus={filterMenus}
      trigger='contextMenu'
      menus={dropMenu}
      menuClick={menuClick}
    >
      <div>
        <CodeEditor
          mode={mode}
          onLoad={onLoad}
          readOnly
          value={typeof data === 'function' ? data() : data}
          width={size.width}
          height={size.height}
        />
      </div>
    </DropDown>
  </div>);
});
