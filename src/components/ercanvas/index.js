import ReactDOM from 'react-dom';
import moment from 'moment';
import html2canvas from 'html2canvas';
import React, { useEffect, useRef, useMemo } from 'react';
import { Graph, Shape, Addon, DataUri } from '@antv/x6';
import {Button, openModal, FormatMessage, Message, Modal, openDrawer} from 'components';
import './components';
import _ from 'lodash/object';
import RelationEditor from './RelationEditor';
import {
  getEmptyEntity,
  generatorTableKey,
  calcCellData, calcNodeData, mapData2Table,
} from '../../lib/datasource_util';
import { separator } from '../../../profile';
import Entity from '../../app/container/entity';
import {getPrefix} from '../../lib/prefixUtil';
import { img } from '../../lib/generatefile/img';
import LabelEditor from './LabelEditor';
import FindEntity from './FindEntity';
import clipCanvasEmptyPadding from './_util/clip_canvas';

const { Dnd } = Addon;

export default ({data, dataSource, renderReady, updateDataSource, validateTableStatus, prefix,
                  dataChange, openEntity, tabKey, activeKey, scaleChange, common, tabDataChange,
                  changes, versionsData, save, getDataSource, openDict, selectionChanged,
                  jumpEntity, diagramKey, relationType, ...restProps}) => {
  const currentPrefix = getPrefix(prefix);
  const isInit = useRef(false);
  const findRef = useRef(null);
  const needRender = useRef(false);
  const graphRef = useRef(null);
  const dndRef = useRef(null);
  const interactingRef = useRef(true);
  const dataSourceRef = useRef(dataSource);
  dataSourceRef.current = dataSource;
  const currentColor = useRef({
    selected: '#1890FF', // 选中色
    border: '#DFE3EB', // 边框色
    fillColor: '#ACDAFC', // 节点和边的背景色
    fontColor: '#000000', // 节点字体色
    circleFill: '#FFF', // 锚点填充色
  });
  const defaultGroupNodeSize = {
    width: 240,
    height: 160,
    minHeight: 160,
  };
  const defaultEditNodeSize = {
    width: 80,
    height: 60,
    minHeight: 20,
  };
  const defaultEditNodeCircleSize = {
    width: 80,
    height: 60,
    minHeight: 20,
  };
  const defaultEditNodePolygonSize = {
    width: 80,
    height: 80,
    minHeight: 20,
  };
  const commonPort = {
    attrs: {
      fo: {
        width: 8,
        height: 8,
        x: -4,
        y: -4,
        magnet: 'true',
        style: {
          visibility: 'hidden',
        },
      },
    },
    zIndex: 3,
  };
  const commonPorts = {
    groups: {
      in: {
        ...commonPort,
        position: { name: 'left' },
      },
      out: {
        ...commonPort,
        position: { name: 'right' },
      },
      top: {
        ...commonPort,
        position: { name: 'top' },
      },
      bottom: {
        ...commonPort,
        position: { name: 'bottom' },
      },
    },
    items: [
      {group: 'in', id: 'in'},
      {group: 'in', id: 'in2'},
      {group: 'in', id: 'in3'},
      {group: 'out', id: 'out'},
      {group: 'out', id: 'out2'},
      {group: 'out', id: 'out3'},
      {group: 'top', id: 'top'},
      {group: 'top', id: 'top2'},
      {group: 'top', id: 'top3'},
      {group: 'bottom', id: 'bottom'},
      {group: 'bottom', id: 'bottom2'},
      {group: 'bottom', id: 'bottom3'},
    ],
  };
  const commonPolygonPorts = {
    groups: {
      in: {
        ...commonPort,
        position: { name: 'left' },
      },
      out: {
        ...commonPort,
        position: { name: 'right' },
      },
      top: {
        ...commonPort,
        position: { name: 'top' },
      },
      bottom: {
        ...commonPort,
        position: { name: 'bottom' },
      },
    },
    items: [
      {group: 'in', id: 'in'},
      {group: 'out', id: 'out'},
      {group: 'top', id: 'top'},
      {group: 'bottom', id: 'bottom'},
    ],
  };
  const commonEntityPorts = {
    groups: {
      in: {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: currentColor.current.selected,
            fill: currentColor.current.circleFill,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        zIndex: 3,
        position: { name: 'left' },
      },
      out: {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: currentColor.current.selected,
            fill: currentColor.current.circleFill,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        position: { name: 'right' },
      },
      top: {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: currentColor.current.selected,
            fill: currentColor.current.circleFill,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        position: { name: 'top' },
      },
      bottom: {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: currentColor.current.selected,
            fill: currentColor.current.circleFill,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        position: { name: 'bottom' },
      },
    },
    items: [
      {group: 'in', id: 'in'},
      {group: 'in', id: 'in2'},
      {group: 'in', id: 'in3'},
      {group: 'out', id: 'out'},
      {group: 'out', id: 'out2'},
      {group: 'out', id: 'out3'},
      {group: 'top', id: 'top'},
      {group: 'top', id: 'top2'},
      {group: 'top', id: 'top3'},
      {group: 'bottom', id: 'bottom'},
      {group: 'bottom', id: 'bottom2'},
      {group: 'bottom', id: 'bottom3'},
    ],
  };
  const id = useMemo(() => `er-${Math.uuid()}`, []);
  const getTableGroup = () => {
    return {
      in: {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: currentColor.current.selected,
            fill: currentColor.current.circleFill,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        position: { name: 'absolute' },
        zIndex: 3,
      },
      out: {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: currentColor.current.selected,
            fill: currentColor.current.circleFill,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        position: { name: 'absolute' },
        zIndex: 3,
      },
      extend: {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: currentColor.current.selected,
            fill: currentColor.current.circleFill,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        position: { name: 'absolute' },
        zIndex: 3,
      },
    };
  };
  const getEntityInitFields = () => {
    return _.get(dataSourceRef.current, 'profile.default.entityInitFields', [])
      .map((f) => {
      return {
        ...f,
        id: Math.uuid(),
      };
    });
  };
  const getEntityInitProperties = () => {
    return _.get(dataSourceRef.current, 'profile.default.entityInitProperties', {});
  };
  const updateFields = (originKey, fields) => {
    if (!validateTableStatus(`${originKey}${separator}entity`)) {
      const getKey = (f) => {
        return `${f.defKey}${f.defName}`;
      };
      const result = {};
      const newDataSource = {
        ...dataSourceRef.current,
        entities: dataSourceRef.current.entities.map((e) => {
          if (e.id === originKey) {
            const success = fields
                .filter(f => (e.fields || [])
                    .findIndex(eFiled => getKey(eFiled) === getKey(f)) < 0);
            result.success = success.length;
            result.hidden = success.filter(f => f.hideInGraph).length;
            return {
              ...e,
              fields: (e.fields || []).concat(success.map(s => ({...s, isStandard: true}))),
            };
          }
          return e;
        }),
      };
      updateDataSource && updateDataSource(newDataSource);
      if (result.success === fields.length) {
        Message.success({title: FormatMessage.string({id: 'optSuccess'})});
      } else {
        Modal.info({
          title: <FormatMessage id='optEnd'/>,
          message: <div>
            {result.success > 0 && <div>
              <FormatMessage
                id='standardFields.dropFieldsSuccessResult'
                data={{success: result.success}}
              />
              (
              <FormatMessage
                id='standardFields.dropFieldsShowResult'
                data={{show: result.success - result.hidden}}
              />{result.hidden > 0 && <FormatMessage
                id='standardFields.dropFieldsHiddenResult'
                data={{hidden: result.hidden}}
            />})</div>}
            <div>
              <FormatMessage
                id='standardFields.dropFieldsFailResult'
                data={{fail: fields.length - result.success}}
              />
            </div>
          </div>,
        });
      }
    } else {
      Modal.error({
        title: <FormatMessage id='optFail'/>,
        message: <FormatMessage id='canvas.node.entityHasOpen'/>,
      });
    }
  };
  const updateColor = (key, color) => {
    //currentColor.current[key] = color.hex;
    let cells = graphRef.current.getSelectedCells();
    if (cells.length === 0) {
      cells = graphRef.current.getCells();
    }
    cells
        .forEach((c) => {
          c.setProp(key, color.hex, { ignoreHistory : true});
          if (c.shape === 'erdRelation') {
            if (key === 'fillColor') {
              const tempLine = c.attr('line');
              c.attr('line', {
                ...tempLine,
                stroke: color.hex,
                sourceMarker: {
                  ...tempLine.sourceMarker,
                  fillColor: color.hex,
                },
                targetMarker: {
                  ...tempLine.targetMarker,
                  fillColor: color.hex,
                },
              }, { ignoreHistory : true});
            }
           c.setLabels([{
             attrs: {
               text: {
                // fill: c.getProp('fontColor'),
                text: c.getLabelAt(0)?.attrs?.text?.text || '',
               },
               rect: {
                // fill: c.getProp('fillColor'),
               },
             },
           }], { ignoreHistory : true, relation: true});
          }
          if (c.shape === 'edit-node-polygon' || c.shape === 'edit-node-circle-svg') {
            if (key === 'fillColor') {
              c.attr('body/fill', color.hex, { ignoreHistory : true});
            } else {
              c.attr('text/style/fill', color.hex, { ignoreHistory : true});
            }
          }
        });
    dataChange && dataChange(graphRef.current.toJSON({diff: true}));
  };
  const getScaleNumber = () => {
    return graphRef.current.scale();
  };
  const validateScale = (factor) => {
    graphRef.current.zoom(factor);
  };
  const render = () => {
    if (!isInit.current) {
      graphRef.current.fromJSON({
        cells: calcCellData(data?.canvasData?.cells || [], dataSourceRef.current, updateFields,
          getTableGroup(), commonPorts, relationType, commonEntityPorts),
      });
    } else {
      // 需要更新数据表相关的节点
      const cells = graphRef.current.getCells();
      graphRef.current.batchUpdate('update', () => {
        cells.filter(c => c.shape === 'table').forEach((c) => {
          const { size, ports, ...rest } = mapData2Table({
              originKey: c.data.id,
              ports: c.ports,
              data: c.getProp('data'),
            },
            dataSource, updateFields, getTableGroup(),
            commonPorts, relationType, commonEntityPorts) || {};
          if (size) {
            // 需要取消撤销重做的记录
            c.setProp('data', rest.data, { ignoreHistory : true});
            c.setProp('size', size, { ignoreHistory : true});
            c.setProp('ports', ports, { ignoreHistory : true});
          } else {
            graphRef.current.removeCell(c, { ignoreHistory : true});
          }
        });
      });
    }
  };
  useEffect(() => {
    const container = document.getElementById(id);
    const changePortsVisible = (visible, node, source) => {
      const currentNodeDom = node ? Array.from(container.querySelectorAll('.x6-node')).filter((n) => {
        return n.getAttribute('data-cell-id') === node.id;
      })[0] : container;
      const ports = currentNodeDom?.querySelectorAll(
          '.x6-port-body',
      ) || [];
      for (let i = 0, len = ports.length; i < len; i += 1) {
        const portName = ports[i].getAttribute('port');
        if (source && source.includes('extend')) {
          if (portName.includes('extend')) {
            ports[i].style.visibility = visible ? 'visible' : 'hidden';
          } else {
            ports[i].style.visibility = 'hidden';
          }
        } else if (source && portName.includes('extend')) {
          ports[i].style.visibility = 'hidden';
        } else {
          ports[i].style.visibility = visible ? 'visible' : 'hidden';
        }
      }
      if (visible && (!node || node.shape !== 'group')) {
        node.toFront();
      }
    };
    const graph = new Graph({
      async: true,
      container,
      autoResize: false,
      snapline: true,
      translating: {
        restrict(view) {
          const cell = view.cell;
          if (cell.isNode()) {
            const parent = cell.getParent();
            // 限制节点
            if (parent && graph.isSelected(parent)) {
              return parent.getBBox();
            }
          }
          return null;
        },
      },
      history: {
        enabled: true,
        beforeAddCommand(event, args) {
          if (args.key === 'zIndex') {
            return false;
          }
          return !args.options.ignoreHistory;
        },
      },
      minimap: {
        enabled: true,
        container: document.getElementById(`${id}minimapContainer`),
        graphOptions: {
          async: true,
          // eslint-disable-next-line consistent-return
          createCellView:(cell) => {
            // 在小地图中不渲染边
            if (cell.isEdge()) {
              return null;
            }
          },
        },
      },
      keyboard: {
        enabled: true,
      },
      clipboard: {
        enabled: true,
        useLocalStorage: true,
      },
      scroller: {
        enabled: true,
        pannable: true,
        modifiers: ['ctrl', 'meta'],
      },
      selecting: {
        enabled: true,
        multiple: true,
        rubberband: true,
        //modifiers: 'alt|ctrl',
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
      },
      connecting: {
        connectionPoint: 'anchor',
        snap: true,
        allowBlank: false,
        allowNode: false,
        createEdge() {
          return new Shape.Edge({
            shape: 'erdRelation',
            attrs: {
              line: {
                strokeDasharray: '5 5',
                strokeWidth: 1,
                stroke: currentColor.current.fillColor,
              },
            },
            router: {
              name: 'manhattan',
            },
          });
        },
        validateConnection({targetPort, targetView, sourcePort,sourceCell}) {
          if (targetView) {
            const node = targetView.cell;
            changePortsVisible(true, node, sourcePort);
            if (sourcePort) {
              // 阻止自连
              if ((sourcePort === targetPort) && (sourceCell === node)) {
                return false;
              }
            }
            if (sourcePort && sourcePort.includes('extend')) {
              return targetPort.includes('extend');
            }
            return !targetPort.includes('extend');
          }
          return true;
        },
      },
      grid: false,
      resizing: {
        minWidth: defaultEditNodeSize.width,
        minHeight: defaultEditNodeSize.minHeight,
        enabled:  (node) => {
          return node.shape === 'edit-node' ||
              node.shape === 'edit-node-circle' ||
              node.shape === 'group' || node.shape === 'edit-node-polygon'
            || node.shape === 'edit-node-circle-svg';
        },
        preserveAspectRatio: (node) => {
          return node.shape === 'edit-node-circle-svg'
            || node.shape === 'edit-node-polygon';
        },
      },
      interacting: () => {
        if (interactingRef.current) {
          return {
            nodeMovable: ({cell}) => {
              return !((cell.shape === 'edit-node' || cell.shape === 'group'
                  || cell.shape === 'edit-node-circle'
                  || cell.shape === 'edit-node-polygon'
                  || cell.shape === 'edit-node-circle-svg')
                && cell.getProp('editable'));
            },
          };
        }
        return false;
      },
      onPortRendered(args) {
        const selectors = args.contentSelectors;
        const c = selectors && selectors.foContent;
        if (c) {
          ReactDOM.render(
            <div className={`${currentPrefix}-port`} />,
              c,
          );
        }
      },
      embedding: {
        enabled: true,
        findParent({ node }) {
          const bbox = node.getBBox();
          return this.getNodes().filter((n) => {
            const shape = n.shape;
            if (shape === 'group') {
              const targetBBox = n.getBBox();
              return bbox.isIntersectWithRect(targetBBox);
            }
            return false;
          });
        },
      },
      highlighting: {
        embedding: {
          name: 'stroke',
          args: {
            padding: -1,
            attrs: {
              stroke: '#4e75fd',
            },
          },
        },
      },
      scaling: {
        min: 0.1,
        max: 2,
      },
    });
    const addEntityData = (cell, type) => {
      const cells = [].concat(cell);
      let initData = {};
      if (type === 'create') {
        initData = {
          headers: getEmptyEntity().headers,
          fields: getEntityInitFields(),
          properties: getEntityInitProperties(),
        };
      }
      return {
        ...dataSourceRef.current,
        entities: dataSourceRef.current.entities.concat(cells.map(c => ({
          ..._.omit(c.data, ['maxWidth', 'count']),
          ...initData,
        }))),
        viewGroups: (dataSourceRef.current.viewGroups || []).map((g) => {
          if ((g.refDiagrams || []).includes(tabKey.split(separator)[0])) {
            return {
              ...g,
              refEntities: (g.refEntities || []).concat(cells.map(c => c.data.id)),
            };
          }
          return g;
        }),
      };
    };
    graph.bindKey(['ctrl+c','command+c'], (e) => {
      const cells = graph.getSelectedCells();
      if (e.target.tagName !== 'TEXTAREA' && cells && cells.length) {
        graph.copy(cells);
      } else {
        graph.cleanClipboard();
      }
    });
    graph.bindKey(['ctrl+m','command+m'], () => {
      const minimapContainer = document.getElementById(`${id}minimapContainer`);
      if (minimapContainer) {
        if (minimapContainer.style.opacity === '0') {
          minimapContainer.style.opacity = '1';
          minimapContainer.style.pointerEvents = 'auto';
        } else {
          minimapContainer.style.opacity = '0';
          minimapContainer.style.pointerEvents = 'none';
        }
      }
    });
    graph.bindKey(['ctrl+f','command+f'], () => {
      const ersearchContainer = document.getElementById(`${id}ersearch`);
      if (ersearchContainer) {
        if (ersearchContainer.style.display === 'none') {
          ersearchContainer.style.display = 'block';
          findRef.current?.focus();
        } else {
          ersearchContainer.style.display = 'none';
        }
      }
    });
    graph.bindKey(['ctrl+v','command+v'], (e) => {
      if (!graph.isClipboardEmpty() && e.target.tagName !== 'TEXTAREA') {
        graph.resetSelection();
        const cells = graph.paste();
        const keys = [];
        const copyEntities = cells
          .filter(c => c.shape === 'table').map((c) => {
            const copyDefKey = c.getData().defKey || '';
            const tempKey = /_(\d)+$/.test(copyDefKey) ? copyDefKey : `${copyDefKey}_1`;
            const newKey = generatorTableKey(tempKey, {
              entities: (dataSourceRef.current.entities || []).concat(keys),
            });
            keys.push({defKey: newKey});
            const entityId = Math.uuid();
            c.setProp('originKey', entityId, {ignoreHistory : true});
            c.setData({defKey: newKey}, {ignoreHistory : true, relation: true});
            c.setData({id: newKey}, {ignoreHistory : true, relation: true});
            return {
              data: c.data,
            };
          });
        updateDataSource && updateDataSource(addEntityData(copyEntities, 'copy'));
        graph.select(cells);
      }
    });
    graph.bindKey(['ctrl+z','command+z'], () => {
      graph.undo({undo: true});
    });
    graph.bindKey(['ctrl+shift+z','command+shift+z'], () => {
      graph.redo({redo: true});
    });
    graph.on('render:done', () => {
      if (!isInit.current) {
        graphRef.current.centerContent();
        isInit.current = true;
      }
    });
    graphRef.current = graph;
    dndRef.current = new Dnd({
      target: graph,
      scaled: false,
      animation: true,
    });
    // 创建右键菜单
    const createContentMenu = (event, menus, cb) => {
      let menuContainer = document.querySelector('.ercanvas-menus');
      if (menuContainer) {
        menuContainer.parentElement.removeChild(menuContainer);
      }
      menuContainer = document.createElement('div');
      menuContainer.setAttribute('class', 'ercanvas-menus');
      document.body.appendChild(menuContainer);
      menuContainer.onblur = () => {
        menuContainer.onblur = null;
        menuContainer.onclick = null;
        menuContainer.style.display = 'none';
      };
      menuContainer.onclick = () => {
        menuContainer.blur();
      };
      menuContainer.setAttribute('tabindex', '0');
      menuContainer.style.left = `${event.clientX + 1}px`;
      menuContainer.style.top = `${event.clientY + 1}px`;
      const ul = document.createElement('ul');
      menus.forEach((m, i) => {
        const li = document.createElement('li');
        li.onclick = () => {
          cb && cb(i);
        };
        li.innerText = m.name;
        ul.appendChild(li);
      });
      menuContainer.appendChild(ul);
      setTimeout(() => {
        menuContainer.focus();
      });
    };
    graph.on('cell:changed', ({options}) => {
      if (!((Object.keys(options).length === 0) || (options.ignoreHistory && !options.relation))) {
        // 过滤掉无需保存的数据
        dataChange && dataChange(graph.toJSON({diff: true}));
      }
    });
    graph.on('cell:removed', ({cell}) => {
      if (cell.shape === 'table') {
        const count = cell.getProp('count');
        graph.batchUpdate('count', () => {
          graph.getNodes()
            .filter(n => n.shape === 'table' &&
              n.getProp('count') &&
              n.getProp('count') > count)
            .forEach((n) => {
            n.setProp('count', n.getProp('count') - 1);
          });
        });
      }
      dataChange && dataChange(graph.toJSON({diff: true}));
    });
    graph.on('cell:added', () => {
      dataChange && dataChange(graph.toJSON({diff: true}));
    });
    graph.on('selection:changed', ({ added,removed }) => {
      console.log(added);
      added.forEach((cell) => {
        if (cell.isNode()) {
          cell.attr('body', {
            stroke: 'red',
            strokeWidth: 3,
          }, { ignoreHistory : true});
          cell.shape !== 'table' && changePortsVisible(false, cell);
        } else {
          cell.attr('line/stroke', currentColor.current.selected, { ignoreHistory : true});
          cell.attr('line/strokeWidth', 2, { ignoreHistory : true});
        }
      });
      removed.forEach((cell) => {
        if (cell.isNode()) {
          cell.attr('body', {
            stroke: cell.shape === 'group' ? '#000000' : currentColor.current.border,
            strokeWidth: 2,
          }, { ignoreHistory : true});
          if (cell.shape === 'edit-node-polygon' || cell.shape === 'edit-node-circle-svg' ||
            cell.shape === 'edit-node' || cell.shape === 'edit-node-circle' || cell.shape === 'group') {
            if (cell.shape === 'group') {
              // 暂时隐藏所有的子节点
              const cells = cell.getChildren();
              if (cells) {
                cells.forEach((c) => {
                  c.show();
                });
              }
            }
            if (cell.shape === 'edit-node-polygon' || cell.shape === 'edit-node-circle-svg') {
              graph.batchUpdate(() => {
                cell.removeTools();
                cell.setProp('label', cell.attr('text/text'));
                cell.attr('text/style/display', '');
                cell.attr('body', {
                  stroke: currentColor.current.border,
                  strokeWidth: 1,
                });
              }, { ignoreHistory : true});
            }
            cell.setProp('editable', false, { ignoreHistory : true, relation: true});
          }
        } else {
          cell.attr('line/stroke', cell.getProp('fillColor')
              || currentColor.current.fillColor, { ignoreHistory : true});
          cell.attr('line/strokeWidth', 1, { ignoreHistory : true});
        }
      });
      selectionChanged && selectionChanged(added);
    });
    graph.on('edge:removed', ({edge}) => {
      const sourceCell = graph.getCell(edge.getSourceCellId());
      const targetCell = graph.getCell(edge.getTargetCellId());
      targetCell && targetCell.setProp('targetPort', Math.uuid(), { ignoreHistory : true});
      sourceCell && sourceCell.setProp('sourcePort', Math.uuid(), { ignoreHistory : true});
    });
    graph.on('edge:connected', (args) => {
      const edge = args.edge;
      const node = graph.getCellById(edge.target.cell);
      const sourceNode = graph.getCellById(edge.source.cell);
      if (edge.target.port.includes('extend')) {
        graph.removeCell(edge, { ignoreHistory: true });
        graph.history.undoStack.pop();
        const primaryKeys = (node.data?.fields || []).filter(f => f.primaryKey);
        if (primaryKeys.length === 0) {
          Message.error({title: FormatMessage.string({id: 'canvas.node.extendError'})});
        } else {
          // 增加主键之间的连线
          const allEdges = graph.getEdges();
          const tempEdges = primaryKeys.map((p) => {
            return {
              id: Math.uuid(),
              shape: 'erdRelation',
              relation: '1:n',
              source: {
                cell: edge.target.cell,
                port: `${p.id}${separator}out`,
              },
              target: {
                cell: edge.source.cell,
                port: `${p.id}${separator}in`,
              },
            };
          }).filter((e) => {
            // 过滤重复的连接线
            return allEdges.findIndex((old) => {
              if((old.source.cell === e.source.cell)
                  && (old.target.cell === e.target.cell)) {
                return  (old.source.port === e.source.port)
                    && (old.target.port === e.target.port);
              } else if((old.source.cell === e.target.cell)
                  && (old.target.cell === e.source.cell)) {
                return  (old.source.port === e.target.port)
                    && (old.target.port === e.source.port);
              }
              return false;
            }) < 0;
          });
          graph.addEdges(tempEdges, { auto: true});
          const sourceKey = sourceNode.getProp('originKey');
          const newDataSource = {
            ...dataSourceRef.current,
            entities: (dataSourceRef.current.entities || []).map(((entity) => {
              if (entity.id === sourceKey) {
                const tempFields = entity.fields || [];
                const tempPrimaryKeys = primaryKeys
                    .filter(p => tempFields
                        .findIndex(f => f.id === p.id) < 0);
                return {
                  ...entity,
                  fields: tempPrimaryKeys.concat(tempFields),
                };
              }
              return entity;
            })),
          };
          updateDataSource && updateDataSource(newDataSource);
        }
      } else {
        edge.setProp('relation', '1:n', { ignoreHistory: true });
        edge.setProp('fillColor', currentColor.current.fillColor, { ignoreHistory: true });
        edge.attr({
          line: {
            strokeDasharray: '',
            sourceMarker: {
              name: 'relation',
              relation: '1',
            },
            targetMarker: {
              name: 'relation',
              relation: 'n',
            },
          },
        }, { ignoreHistory: true, relation: true });
      }
      const calcPorts = (port, calcNode) => {
        const incomingEdges = graph.getIncomingEdges(calcNode) || [];
        const outgoingEdges = graph.getOutgoingEdges(calcNode) || [];
        const usedPorts = incomingEdges.map((e) => {
          return e.getTargetPortId();
        }).concat(outgoingEdges.map((e) => {
          return e.getSourcePortId();
        }));
        const currentGroup = (/(\d+)/g).test(port) ? port.match(/[A-Za-z]+/g)[0] : port;
        const currentGroupPorts = calcNode.getPorts()
            .filter(p => p.group === currentGroup).map(p => p.id);
        if (currentGroupPorts.length ===
            [...new Set(usedPorts.filter(p => p.includes(currentGroup)))].length) {
          calcNode.addPort({
            id: `${currentGroup}${currentGroupPorts.length + 1}`, group: currentGroup,
          });
        }
      };
      if (node.shape === 'edit-node' || (relationType === 'entity' && node.shape === 'table')) {
        // 判断输入锚点是否已经用完
        calcPorts(edge.target.port, node);
      }
      if (sourceNode.shape === 'edit-node' || (relationType === 'entity' && node.shape === 'table')) {
        // 判断输出锚点是否已经用完
        calcPorts(edge.source.port, sourceNode);
      }
    });
    graph.on('edge:contextmenu', ({cell, e}) => {
      let lineType = 'straightLine';
      if (cell.getProp('router')?.name === 'normal') {
        lineType = 'brokenLine';
      }
      createContentMenu(e, [
        {name: FormatMessage.string({id: 'canvas.edge.editRelation'})},
        {name: FormatMessage.string({id: 'canvas.edge.relationLabel'})},
        {name: FormatMessage.string({id: `canvas.edge.${lineType}`})},
      ], (i) => {
        if (i === 0) {
          const label = cell.getProp('relation') || '1:n';
          const relationArray = label.split(':');
          const relationChange = (value, type) => {
            const index = type === 'form' ? 0 : 1;
            relationArray[index] = value;
          };
          let modal = null;
          const onOK = () => {
            cell.setProp('relation', relationArray.join(':') || '1:n', { ignoreHistory : true});
            cell.attr('line', {
              sourceMarker: {
                relation: relationArray[0],
              },
              targetMarker: {
                relation: relationArray[1],
              },
            });
            modal && modal.close();
          };
          const onCancel = () => {
            modal && modal.close();
          };
          modal = openModal(
            <RelationEditor
              label={label}
              relationChange={relationChange}
              />,
              {
                title: <FormatMessage id='canvas.edge.setRelation'/>,
                buttons: [
                  <Button key='onOK' onClick={onOK} type='primary'>
                    <FormatMessage id='button.ok'/>
                  </Button>,
                  <Button key='onCancel' onClick={onCancel}>
                    <FormatMessage id='button.cancel'/>
                  </Button>,
                ],
              });
        } else if (i === 1){
          let modal = null;
          let value = cell.getLabelAt(0)?.attrs?.text?.text || '';
          const labelChange = (v) => {
            value = v;
          };
          const onOK = () => {
            cell.setLabels([{
              attrs: {
                text: {
                  // fill: cell.getProp('fontColor'),
                  text: value,
                },
                rect: {
                  // fill: cell.getProp('fillColor'),
                },
              },
            }], { ignoreHistory : true, relation: true});
            modal && modal.close();
          };
          const onCancel = () => {
            modal && modal.close();
          };
          modal = openModal(
            <LabelEditor
              label={value}
              labelChange={labelChange}
            />,
            {
              title: <FormatMessage id='canvas.edge.relationLabel'/>,
              buttons: [
                <Button key='onOK' onClick={onOK} type='primary'>
                  <FormatMessage id='button.ok'/>
                </Button>,
                <Button key='onCancel' onClick={onCancel}>
                  <FormatMessage id='button.cancel'/>
                </Button>,
              ],
            });
        } else {
          graph.batchUpdate('rename', () => {
            if (lineType === 'straightLine') {
              cell.setProp('router', {
                name: 'normal',
              });
              cell.setProp('vertices', []);
            } else {
              cell.setProp('router', {
                name: 'manhattan',
                args: {
                  excludeShapes: ['group'],
                },
              });
            }
            dataChange && dataChange(graph.toJSON({diff: true}));
          });
        }
      });
    });
    graph.on('edge:change:target', (cell) => {
      const previous = graph.getCell(cell.previous.cell);
      const current = graph.getCell(cell.current.cell);
      previous?.setProp('targetPort', '', { ignoreHistory : true});
      if (!cell.options.propertyPath) {
        current?.setProp('targetPort', cell.current.port, { ignoreHistory : true});
      }
    });
    graph.on('edge:change:source', (cell) => {
      const previous = graph.getCell(cell.previous.cell);
      const current = graph.getCell(cell.current.cell);
      previous?.setProp('sourcePort', '', { ignoreHistory : true});
      if (!cell.options.propertyPath) {
        current?.setProp('sourcePort', cell.current.port, { ignoreHistory : true});
      }
    });
    graph.on('edge:mouseup', ({edge}) => {
      const target = edge.getTargetCell();
      const source = edge.getSourceCell();
      target?.setProp('targetPort', '', { ignoreHistory : true});
      source?.setProp('sourcePort', '', { ignoreHistory : true});
      changePortsVisible(false);
    });
    graph.on('edge:added', ({edge, options}) => {
      if (!options.auto && !options.undo && !options.redo) {
        const source = edge.getSourceCell();
        source.setProp('sourcePort', edge.getSource().port, { ignoreHistory : true});
      } else if (options.redo) {
        edge.attr({
          line: {
            strokeDasharray: '',
            sourceMarker: {
              name: 'relation',
              relation: '1',
            },
            targetMarker: {
              name: 'relation',
              relation: 'n',
            },
          },
        }, { ignoreHistory: true });
      }
      edge.removeTools();
    });
    graph.on('edge:selected', ({ edge }) => {
      edge.addTools([
        {
          name: 'vertices',
          args: {
            attrs: {
              stroke: currentColor.current.selected,
              fill: currentColor.current.circleFill,
              strokeWidth: 2,
            },
          },
        },
        {
          name: 'target-arrowhead',
          args: {
            attrs: {
              d: 'M 0, -5 a 5,5,0,1,1,0,10 a 5,5,0,1,1,0,-10',
              fill: currentColor.current.selected,
            },
          },
        },
        {
          name: 'source-arrowhead',
          args: {
            attrs: {
              d: 'M 0, -5 a 5,5,0,1,1,0,10 a 5,5,0,1,1,0,-10',
              fill: currentColor.current.selected,
            },
          },
        },
      ], {}, { ignoreHistory : true});
    });
    graph.on('edge:unselected', ({ edge }) => {
      edge.removeTools({ ignoreHistory : true});
    });
    graph.on('edge:mouseenter', ({edge}) => {
      const sourceNode = edge.getSourceCell();
      const targetNode = edge.getTargetCell();
      sourceNode?.setProp('sourcePort', edge.getSourcePortId(), { ignoreHistory : true});
      targetNode?.setProp('targetPort', edge.getTargetPortId(), { ignoreHistory : true});
      edge.attr('line/stroke', currentColor.current.selected, { ignoreHistory : true});
      edge.attr('line/sourceMarker/fillColor', currentColor.current.selected, { ignoreHistory : true});
      edge.attr('line/targetMarker/fillColor', currentColor.current.selected, { ignoreHistory : true});
    });
    graph.on('edge:mouseleave', ({edge}) => {
      const sourceNode = edge.getSourceCell();
      const targetNode = edge.getTargetCell();
      sourceNode?.setProp('sourcePort','', { ignoreHistory : true});
      targetNode?.setProp('targetPort', '', { ignoreHistory : true});
      edge.attr('line/stroke', edge.getProp('fillColor') ||
          currentColor.current.fillColor, { ignoreHistory : true});
      edge.attr('line/sourceMarker/fillColor', edge.getProp('fillColor') ||
        currentColor.current.fillColor, { ignoreHistory : true});
      edge.attr('line/targetMarker/fillColor', edge.getProp('fillColor') ||
        currentColor.current.fillColor, { ignoreHistory : true});
    });
    graph.on('edge:change:labels', () => {
      dataChange && dataChange(graph.toJSON({diff: true}));
    });
    graph.on('cell:mousedown', ({e}) => {
      interactingRef.current = !(e.ctrlKey || e.metaKey);
    });
    graph.on('node:dblclick', ({cell, e}) => {
      if (cell.shape === 'table') {
        const cellData = cell.getData();
        const key = cell.getProp('originKey');
        const group = dataSourceRef.current?.viewGroups?.
        filter(v => v.refEntities?.some(r => r === key))[0]?.id || '';
        const entityTabKey = `${key + separator}entity`;
        if (!validateTableStatus(entityTabKey)) {
          let drawer;
          const tab = {
            type: 'entity',
            tabKey: entityTabKey,
          };
          const onOK = () => {
            save((fail) => {
              if (!fail) {
                drawer.close();
              }
            });
          };
          const onCancel = () => {
            drawer.close();
          };
          const entityChange = (cData) => {
            tabDataChange && tabDataChange(cData, tab);
          };
          const _openDict = (...args) => {
            openDict && openDict(...args);
            drawer.close();
          };
          drawer = openDrawer(<Entity
            openDict={_openDict}
            getDataSource={getDataSource}
            tabKey={entityTabKey}
            common={common}
            updateDataSource={updateDataSource}
            dataSource={dataSourceRef.current}
            entity={key}
            group={group}
            tabDataChange={entityChange}
            changes={changes}
            versionsData={versionsData}
          />, {
            title: cellData.defName || cellData.defKey,
            width: '80%',
            buttons: [
              <Button key='onSave' onClick={onOK} type='primary'>
                <FormatMessage id='button.save'/>
              </Button>,
              <Button key='onCancel' onClick={onCancel}>
                <FormatMessage id='button.cancel'/>
              </Button>,
            ],
          });
        } else {
          jumpEntity(entityTabKey);
         /* let modal;
          const _jumpEntity = () => {
            jumpEntity(entityTabKey);
            modal.close();
          };
          modal = Modal.error({
            title: <FormatMessage id='optFail'/>,
            // message: <FormatMessage id='canvas.node.entityHasOpen'/>,
            message: <div className={`${currentPrefix}-relation-editor-open-entity`}>
              <div><FormatMessage id='canvas.node.entityHasOpen'/></div>
              <div>
                <FormatMessage id='canvas.node.entityJump'/>
                [<a onClick={_jumpEntity}><FormatMessage id='canvas.node.entityOpen'/></a>]
                <FormatMessage id='canvas.node.entityTab'/>
              </div>
            </div>,
          });*/
        }
      } else if (cell.shape === 'edit-node'
          || cell.shape === 'edit-node-circle'
          || cell.shape === 'group') {
        if (cell.shape === 'group') {
          // 暂时隐藏所有的子节点
          const cells = cell.getChildren();
          if (cells) {
            cells.forEach((c) => {
              c.hide();
            });
          }
        }
        cell.setProp('editable', true, { ignoreHistory : true});
      } else if (cell.shape === 'edit-node-polygon' || cell.shape === 'edit-node-circle-svg') {
        cell.setProp('editable', true, { ignoreHistory : true});
        const p = graph.clientToGraph(e.clientX, e.clientY);
        cell.addTools([
          {
            name: 'editableCell',
            args: {
              x: p.x,
              y: p.y,
            },
          },
        ], {});
      }
      //openEntity(cell.getProp('originKey'), 'entity', null, 'entity.svg');
    });
    graph.on('node:added', ({cell, options}) => {
      if (cell.shape === 'table') {
        if ((dataSourceRef.current.entities || [])
            .findIndex(e => cell.data.id === e.id) < 0){
          updateDataSource && updateDataSource(addEntityData(cell, 'create'));
        }
      }
      if (cell.shape === 'group') {
        cell.toBack();
      }
      if (options.undo && cell.isNode()) {
        cell.attr('body', {
          stroke: currentColor.current.border,
        }, { ignoreHistory : true});
      }
    });
    graph.on('node:mouseenter', ({node}) => {
      if (!graph.isSelected(node) || node.shape === 'table') {
        changePortsVisible(true, node);
      }
    });
    graph.on('node:mouseleave', ({node}) => {
      changePortsVisible(false, node);
    });
    graph.on('scale', (scale) => {
      scaleChange && scaleChange(scale.sx);
    });
    graph.history.on('undo', (args) => {
      console.log(args);
    });
    graph.bindKey(['backspace', 'delete'], () => {
      const cells = graph.getSelectedCells();
      if (cells.length) {
        graph.removeCells(cells.filter(c => !((c.shape === 'edit-node' ||
          (c.shape === 'edit-node-circle-svg') || (c.shape === 'edit-node-polygon')
            || c.shape === 'edit-node-circle' || c.shape === 'group') && (c.getProp('editable')))));
      }
    });
    const startDrag = (e, key) => {
      let empty;
      let count = 0;
      if (!key) {
        empty = {
          ...getEmptyEntity(),
          count: 0,
          defKey: generatorTableKey('TABLE_1', dataSourceRef.current),
          defName: '数据表',
          fields: getEntityInitFields(),
          properties: getEntityInitProperties(),
        };
      } else {
        const dataSourceEntity = dataSourceRef.current?.entities
          ?.filter(entity => entity.id === key)[0];
        empty = {
          ...dataSourceEntity,
        };
        count = graph.getNodes().filter(n => n.data?.id === key).length;
      }
      if (!empty) {
        return;
      }
      const { width, height, fields, headers, maxWidth, ports } =
          calcNodeData(empty, empty, dataSourceRef.current, getTableGroup());
      const node =  graphRef.current.createNode({
        size: {
          width,
          height,
        },
        shape: 'table',
        ports: relationType === 'entity' ? commonEntityPorts : ports,
        originKey: empty.id,
        count,
        updateFields,
        data: {
          ...empty,
          fields,
          headers,
          maxWidth,
        },
      });
      dndRef.current.start(node, e.nativeEvent);
    };
    const startRemarkDrag = (e, type) => {
      const shape = type === 'rect' ? 'edit-node' : 'edit-node-circle';
      const size = type === 'rect' ? defaultEditNodeSize : defaultEditNodeCircleSize;
      const node =  graphRef.current.createNode({
        shape: shape,
        label: '',
        size: size,
        ports: commonPorts,
      });
      dndRef.current.start(node, e.nativeEvent);
    };
    const startGroupNodeDrag = (e) => {
      const node =  graphRef.current.createNode({
        shape: 'group',
        label: '',
        size: defaultGroupNodeSize,
      });
      dndRef.current.start(node, e.nativeEvent);
    };
    const startPolygonNodeDrag = (e) => {
      const node =  graphRef.current.createNode({
        shape: 'edit-node-polygon',
        label: '',
        size: defaultEditNodePolygonSize,
        ports: commonPolygonPorts,
      });
      dndRef.current.start(node, e.nativeEvent);
    };
    const createCircleNode = (e) => {
      const node =  graphRef.current.createNode({
        shape: 'edit-node-circle-svg',
        label: '',
        size: defaultEditNodePolygonSize,
        ports: commonPolygonPorts,
      });
      dndRef.current.start(node, e.nativeEvent);
    };
    const zoomGraph = (factor, scale) => {
      if (scale) {
        graphRef.current.scale(factor);
      } else if (typeof factor === 'number') {
        graphRef.current.zoom(factor);
      } else if (factor === 'fit') {
        graphRef.current.scale(1);
        graphRef.current.zoomToFit({ padding: 12 });
      } else {
        graphRef.current.scale(1);
        graphRef.current.centerContent();
      }
    };
    renderReady && renderReady({
      undo: () => graphRef.current.undo({undo: true}),
      redo: () => graphRef.current.redo({redo: true}),
      startDrag,
      startRemarkDrag,
      startGroupNodeDrag,
      startPolygonNodeDrag,
      createCircleNode,
      zoomGraph,
      validateScale,
      getScaleNumber,
      updateColor,
      exportImg: () => {
        img(graphRef.current.toJSON().cells, relationType,null, false).then((dom) => {
          html2canvas(dom).then((canvas) => {
            document.body.removeChild(dom.parentElement.parentElement);
            const diagram = (dataSourceRef.current?.diagrams || [])
                .filter(d => d.id === diagramKey)[0] || {};

            const clippedCanvas = clipCanvasEmptyPadding(canvas, 30);

            DataUri.downloadDataUri(clippedCanvas.toDataURL('image/png'),
                `${dataSourceRef.current.name}-${diagram.defKey}[${diagram.defName || diagram.defKey}]-${moment().format('YYYYMDHHmmss')}.png`);
          });
        });
      },
    });
  }, []);
  useEffect(() => {
    if (activeKey === tabKey) {
      render();
    } else {
      needRender.current = true;
    }
  }, [
    dataSource.domains,
    dataSource.dicts,
    dataSource.uiHint,
    dataSource.entities,
    dataSource?.profile.default.db,
  ]);
  useEffect(() => {
    const dom = document.getElementById(id);
    if (dom?.clientWidth > 0) {
      graphRef.current.resize(restProps.width, restProps.height);
    }
  }, [restProps.width, restProps.height]);
  useEffect(() => {
    if (activeKey === tabKey && needRender.current) {
      render();
      needRender.current = false;
    }
  }, [activeKey]);
  const getGraph = () => {
    return graphRef?.current;
  };
  return <>
    <div
      id={id}
      style={{height: '100%'}}
    >{}</div>
    <div style={{display: 'none'}} className={`${currentPrefix}-er-search`} id={`${id}ersearch`}>
      <FindEntity ref={findRef} prefix={currentPrefix} getGraph={getGraph} dataSource={dataSource}/>
    </div>
    <div
      style={{opacity: 0, pointerEvents: 'none'}}
      className={`${currentPrefix}-er-minimapContainer`}
      id={`${id}minimapContainer`}
    >
      {}
    </div>
  </>;
};
