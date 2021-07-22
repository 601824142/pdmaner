import React, { useRef, useEffect } from 'react';

import hljs from 'highlight.js';
import { Copy } from '../../lib/event_tool';
import 'highlight.js/styles/atelier-estuary-dark.css';
import FormatMessage from '../formatmessage';
import Input from '../input';
import DropDown from '../dropdown';
import Icon from '../icon';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({data, style, prefix, title}) => {
  const ref = useRef(null);
  const valueRef = useRef('');
  const titleRef = useRef(null);
  const currentRef = useRef(null);
  const searchNodesRef = useRef([]);
  const allCountRef = useRef(null);
  const searchRef = useRef(null);
  useEffect(() => {
    hljs.highlightBlock(ref.current);
    titleRef.current.style.opacity = 0;
    ref.current.style.opacity = 1;
  }, [data]);
  const currentPrefix = getPrefix(prefix);
  const searchClass = `${currentPrefix}-code-highlight-search-value`;
  const dropMenu = [
    { key: 'copy', name: FormatMessage.string({id: 'menus.opt.copy'})},
    { key: 'copyAll', name: FormatMessage.string({id: 'menus.opt.copyAll'})},
  ];
  const menuClick = (m) => {
    let copyData;
    if (m.key === 'copy') {
      copyData = valueRef.current || '';
    } else {
      copyData = ref.current.innerText || '';
    }
    Copy(copyData, FormatMessage.string({id: 'copySuccess'}));
  };
  const onMouseUp = () => {
    valueRef.current = window.getSelection().toString();
  };
  const filterMenus = (m) => {
    if (valueRef.current) {
      return m;
    }
    return m.key === 'copyAll';
  };
  const _onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 70)) {
      searchRef.current.style.display = 'flex';
    }
  };
  const clear = () => {
    Array.from(ref.current.querySelectorAll(`.${searchClass}`)).forEach((n) => {
      // eslint-disable-next-line no-param-reassign
      n.outerHTML = n.outerText;
    });
    searchNodesRef.current = [];
    allCountRef.current.innerText = 0;
    currentRef.current.innerText = 0;
  };
  const _onChange = (e) => {
    searchNodesRef.current = [];
    const value = e.target.value;
    // 1.清除所有的内容
    clear();
    // 2.创建新的搜索内容
    if (e.target.value) {
      let count = 0;
      Array.from(ref.current.childNodes).forEach((n) => {
        if (n.textContent && n.textContent.includes(value)) {
          count += 1;
          const spanHtml = `<span class="${searchClass}">${value}</span>`;
          let newHtml;
          if (n.nodeType === 3) {
            newHtml = n.textContent.replace(value, spanHtml);
            // eslint-disable-next-line no-param-reassign
            const text = document.createElement('span');
            text.innerHTML = newHtml;
            n.parentElement.replaceChild(text, n);
            searchNodesRef.current.push(text);
          } else {
            newHtml = n.innerHTML.replace(value, spanHtml);
            // eslint-disable-next-line no-param-reassign
            n.innerHTML = newHtml;
            searchNodesRef.current.push(n);
          }
        }
      });
      allCountRef.current.innerText = count;
      if (searchNodesRef.current[0]) {
        // 高亮第一个搜索
        const codeRect = ref.current.getBoundingClientRect();
        const nodeRect = searchNodesRef.current[0]?.getBoundingClientRect();
        searchNodesRef.current[0].querySelector(`.${searchClass}`).style.color = '#FFFFFF';
        ref.current.scrollTop += nodeRect.y - codeRect.y - (codeRect.height / 2);
        currentRef.current.innerText = 1;
      }
    }
  };
  const _onIconClick = (type) => {
    if (type === 'down') {
      const codeRect = ref.current.getBoundingClientRect();
      const index = parseInt(currentRef.current.innerText, 10) + 1;
      const nodeRect = searchNodesRef.current[index - 1]?.getBoundingClientRect();
      if (codeRect && nodeRect) {
        searchNodesRef.current[index - 2].querySelector(`.${searchClass}`).style.color = '';
        searchNodesRef.current[index - 1].querySelector(`.${searchClass}`).style.color = '#FFFFFF';
        ref.current.scrollTop += nodeRect.y - codeRect.y - (codeRect.height / 2);
        currentRef.current.innerText = index;
      }
    } else if(type === 'up') {
      const codeRect = ref.current.getBoundingClientRect();
      const index = parseInt(currentRef.current.innerText, 10) - 1;
      const nodeRect = searchNodesRef.current[index - 1]?.getBoundingClientRect();
      if (codeRect && nodeRect) {
        searchNodesRef.current[index].querySelector(`.${searchClass}`).style.color = '';
        searchNodesRef.current[index - 1].querySelector(`.${searchClass}`).style.color = '#FFFFFF';
        ref.current.scrollTop += nodeRect.y - codeRect.y - (codeRect.height / 2);
        currentRef.current.innerText = index;
      }
    } else {
      clear();
      searchRef.current.style.display = 'none';
    }
  };
  return (<div tabIndex='-1' style={style} className={`${currentPrefix}-code-highlight`} onKeyDown={_onKeyDown}>
    <div className={`${currentPrefix}-code-highlight-search`} ref={searchRef}>
      <span className={`${currentPrefix}-code-highlight-search-input`}>
        <Input onChange={_onChange}/>
        <span>
          <span ref={currentRef}>0</span>
          <span>/</span>
          <span ref={allCountRef}>0</span>
        </span>
      </span>
      <Icon type='fa-angle-up' onClick={() => _onIconClick('up')}/>
      <Icon type='fa-angle-down' onClick={() => _onIconClick('down')}/>
      <Icon type='fa-times' onClick={() => _onIconClick('close')}/>
    </div>
    <span ref={titleRef} className={`${currentPrefix}-code-highlight-title`}>
      {title || <FormatMessage id='components.codehighlight.loading'/>}
    </span>
    <DropDown
      filterMenus={filterMenus}
      trigger='contextMenu'
      menus={dropMenu}
      menuClick={menuClick}
    >
      <pre ref={ref} style={{...style, opacity: 0}} onMouseUp={onMouseUp}>
        {typeof data === 'function' ? data() : data}
      </pre>
    </DropDown>
  </div>);
});
