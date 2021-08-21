import React, { forwardRef, useRef, useEffect } from 'react';
import { Graph, Markup } from '@antv/x6';
import marked from 'marked';
import FormatMessage from '../../../formatmessage';
import '@antv/x6-react-shape';
import './style/index.less';
import { renderer } from '../util';
// eslint-disable-next-line import/named
import { platform } from '../../../../lib/middle';

const EditNode = forwardRef(({node}, ref) => {
  const preRef = useRef(null);
  const label = node.getProp('label');
  const inputRef = useRef(null);
  const editable = node.getProp('editable');
  const onChange = () => {
    node.setProp('label', inputRef.current.value, { ignoreHistory : true});
  };
  useEffect(() => {
    if (editable) {
      if (window.getComputedStyle(inputRef.current).pointerEvents !== 'none') {
        inputRef.current.focus();
      }
    } else if (platform === 'json') {
      const links = preRef.current.querySelectorAll('a[href]');
      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          const url = link.getAttribute('href');
          e.preventDefault();
          // eslint-disable-next-line global-require,import/no-extraneous-dependencies
          require('electron').shell.openExternal(url);
        });
      });
    }
  }, [editable]);
  const getLabel = () => {
    marked.use({ renderer });
    return marked(label);
  };
  return <div
    ref={ref}
    className={`chiner-er-editnode ${node.shape === 'edit-node-circle' ? 'chiner-er-editnode-circle' : ''}`}
    style={{
      background: node.getProp('fillColor'),
      color: node.getProp('fontColor'),
      zIndex: 10,
      alignItems: node.shape === 'group' ? 'start' : 'center',
    }}
  >
    {
      editable ? <textarea
        onChange={onChange}
        placeholder={FormatMessage.string({id: 'canvas.node.remarkPlaceholder'})}
        ref={inputRef}
        defaultValue={label}
      /> :
        // eslint-disable-next-line react/no-danger
      <pre ref={preRef} dangerouslySetInnerHTML={{__html: getLabel()}}/>
    }
  </div>;
});

Graph.registerNode('edit-node', {
  inherit: 'react-shape',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

Graph.registerNode('edit-node-circle', {
  inherit: 'react-shape',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
      rx: 10,
      ry: 10,
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

Graph.registerNode('edit-node-polygon', {
  inherit: 'polygon',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
      refPoints: '0,10 10,0 20,10 10,20',
    },
    text: {
      style: {
        fontSize: '12px',
        fill: 'rgba(0, 0, 0, 0.65)',
      },
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
});

Graph.registerNode('edit-node-circle-svg', {
  inherit: 'circle',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
    },
    text: {
      style: {
        fontSize: '12px',
        fill: 'rgba(0, 0, 0, 0.65)',
      },
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
});


Graph.registerNode('group', {
  inherit: 'react-shape',
  zIndex: 1,
  attrs: {
    body: {
      strokeDasharray: '5 5',
      strokeWidth: 1,
      stroke: '#000000',
    },
  },
  component: <EditNode/>,
});
