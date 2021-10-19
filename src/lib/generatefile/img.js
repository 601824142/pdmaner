import {Graph} from '@antv/x6';
import _ from 'lodash/object';

import { calcCellData } from '../datasource_util';
import html2canvas from 'html2canvas';
import { saveTempImages } from '../middle';
import clipCanvasEmptyPadding from 'components/ercanvas/_util/clip_canvas';

export const img = (data, relationType, dataSource, needCalc = true, groups) => {
  return new Promise((res) => {
    const dom = document.createElement('div');
    dom.style.width = `${300}px`;
    dom.style.height = `${600}px`;
    document.body.appendChild(dom);
    const graph = new Graph({
      container: dom,
      async: true,
      autoResize: false,
      grid: false,
      scroller: {
        enabled: true,
      },
    });
    const cells = ((needCalc ? calcCellData(data, dataSource, null, groups, null, relationType, null) : data)).map((d) => {
      const other = {
        tools: {},
      };
      if (d.shape === 'erdRelation') {
        const relation = d.relation?.split(':') || [];
        other.attrs = {
          ...(d.attrs || {}),
          line: {
            ..._.get(d, 'attrs.line'),
            strokeWidth: 1,
            stroke: d.fillColor || '#ACDAFC',
            sourceMarker: {
              ..._.get(d, 'attrs.line.sourceMarker'),
              name: '',
            },
            targetMarker: {
              ..._.get(d, 'attrs.line.targetMarker'),
              name: (relation[1] && relation[1] === 'arrow') ? 'classic' : '',
            },
          }
        }
        other.labels = (d.labels || []).map(l => {
          return {
            ...l,
            position: {
              ...l.position,
              offset: l.position?.offset ?  l.position?.offset + 8 : {
                x: 10,
                y: 8,
              },
            },
          }
        }).concat([{
          attrs: {
            text: {
              text: (relation[0] || '').toLocaleUpperCase(),
            },
          },
          position: {
            distance: 10,
            offset: {
              x: 10,
              y: 8,
            },
          },
        },
          {
            attrs: {
              text: {
                text: (relation[1] || '').toLocaleUpperCase(),
              },
            },
            position: {
              distance: -10,
              offset: {
                x: 10,
                y: 8,
              },
            },
          }].filter(l => {
            const text = _.get(l, 'attrs.text.text');
            return text !== 'NONE' && text !== 'ARROW';
        }));
      }
      if (d.shape === 'edit-node-polygon' || d.shape === 'edit-node-circle-svg') {
        return {
          ...d,
          shape: `${d.shape}-img`,
        };
      }
      return {
        ..._.omit(d, ['attrs', 'component']),
        shape: `${d.shape}-img`,
        ...other,
      };
    });
    graph.on('render:done', () => {
      graph.centerContent();
      res(dom);
    });
    graph.fromJSON({cells});
    if (cells.length === 0) {
      res(dom);
    }
  })
};

export const imgAll = (dataSource, callBack) => {
  if ((dataSource.diagrams || []).length === 0){
    return new Promise((res, rej) => {
      saveTempImages([])
        .then((dir) => {
          res(dir);
        }).catch(err => rej(err));
    });
  }
  return new Promise((res, rej) => {
    Promise.all((dataSource.diagrams).map(d => {
      return new Promise((res, rej) => {
        const hiddenPort = {
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              strokeWidth: 1,
              style: {
                visibility: 'hidden',
              },
            },
          },
          position: { name: 'absolute' },
          zIndex: 3,
        };
        img(d.canvasData.cells, d.relationType, dataSource, true, {
          in: {
            ...hiddenPort,
          },
          out: {
            ...hiddenPort,
          },
          extend: {
           ...hiddenPort,
          },
        }).then((dom) => {
          html2canvas(dom).then((canvas) => {
            document.body.removeChild(dom.parentElement.parentElement);
            const clippedCanvas = clipCanvasEmptyPadding(canvas, 30);
            const dataBuffer = Buffer.from(clippedCanvas.toDataURL('image/png')
                    .replace(/^data:image\/\w+;base64,/, ""),
                'base64');
            res({fileName: d.id, data: dataBuffer});
            callBack && callBack();
          });
        })
      });
    })).then((result) => {
      saveTempImages(result)
          .then((dir) => {
        res(dir);
      }).catch(err => rej(err));
    }).catch(err => rej(err));
  });
}

