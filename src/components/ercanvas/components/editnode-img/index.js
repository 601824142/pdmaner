import React, { forwardRef } from 'react';
import { Graph, Markup } from '@antv/x6';
import '@antv/x6-react-shape';
import marked from 'marked';
import { renderer } from '../util';

const EditNode = forwardRef(({node}, ref) => {
  const label = node.getProp('label');
  const getLabel = () => {
    marked.use({ renderer });
    return marked(label);
  };
  return <div
    ref={ref}
    style={{
        background: node.getProp('fillColor') || '#FFFFFF',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: node.shape === 'group-img' ? 'start' : 'center',
        width: '100%',
        height: '100%',
        fontSize: '12px',
        borderRadius: node.shape === 'edit-node-circle-img' ? '10px' : '0px',
        border: node.shape === 'group-img' ? '1px dashed #DFE3EB' : '1px solid #DFE3EB',
      }}
  >
    <pre
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{__html: getLabel()}}
      style={{
        padding: '2px',
        WebkitTextFillColor: node.getProp('fontColor') || 'rgba(0,0,0,.65)',
        width: '100%',
        display: 'flex',
        textAlign: 'center',
        flexDirection: 'column',
      }}
    />
  </div>;
});

Graph.registerNode('edit-node-img', {
  inherit: 'react-shape',
  zIndex: 2,
  attrs: {
    body: {},
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

Graph.registerNode('edit-node-circle-img', {
  zIndex: 2,
  inherit: 'react-shape',
  attrs: {
    /*body: {
      rx: 10,
      ry: 10,
    },*/
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

Graph.registerNode('edit-node-polygon-img', {
  inherit: 'polygon',
  zIndex: 2,
  attrs: {
    body: {
      refX: 10,
      refY: 8,
      stroke: '#DFE3EB',
      strokeWidth: 1,
      refPoints: '0,10 10,0 20,10 10,20',
    },
    text: {
      refX2: 10,
      refY2: 8,
      style: {
        fontSize: '12px',
        fill: 'rgba(0, 0, 0, 0.65)',
      },
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
});

Graph.registerNode('edit-node-circle-svg-img', {
  inherit: 'circle',
  zIndex: 2,
  attrs: {
    body: {
      refX: 10,
      refY: 8,
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

Graph.registerNode('group-img', {
  inherit: 'react-shape',
  zIndex: 1,
  attrs: {
    body: {},
  },
  component: <EditNode/>,
});
