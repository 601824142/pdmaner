import React, { useState, useEffect, useMemo, useRef } from 'react';

import { ErCanvas } from 'components';
import { addDomResize, removeDomResize } from '../../../lib/listener';
import { getDataByTabId, removeDataByTabId } from '../../../lib/cache';

const Relation = React.memo(({dataSource, renderReady, diagramKey, validateTableStatus,
                               tabDataChange, tabKey, activeKey, updateDataSource, openEntity,
                               scaleChange, common, changes, versionsData, jumpEntity,
                               save, getDataSource, openDict, selectionChanged}) => {
  const relationRef = useRef(null);
  const offsetWidth = 305;
  const offsetHeight = 148;
  const [id] = useState(Math.uuid());
  const currentRelation = useMemo(() =>
    (dataSource?.diagrams || []).filter(d => d.id === diagramKey)[0], [dataSource]);
  const data = useMemo(() => {
    const tabData = getDataByTabId(tabKey);
    if (tabData) {
      return tabData.data;
    } else {
      return currentRelation?.canvasData;
    }
  }, [dataSource]);
  const getCurrentSize = () => {
    const rect = relationRef.current?.getBoundingClientRect() || {};
    return {
      width: rect.width || document.documentElement.clientWidth - offsetWidth,
      height: rect.height || document.documentElement.clientHeight - offsetHeight,
    };
  };
  const [size, updateSize] = useState(getCurrentSize);
  useEffect(() => {
    addDomResize(relationRef.current, id, () => {
      const { width, height } = getCurrentSize();
      updateSize({width, height});
    });
    return () => {
      removeDomResize(relationRef.current, id);
      removeDataByTabId(tabKey);
    };
  }, []);
  const _renderReady = (cav) => {
    renderReady && renderReady(cav);
  };
  const dataChange = (canvasData) => {
    tabDataChange && tabDataChange({
      type: 'diagram',
      key: diagramKey,
      data: canvasData,
    });
  };
  return <div style={{width: '100%', height: '100%'}} ref={relationRef}>
    <ErCanvas
      validateTableStatus={validateTableStatus}
      updateDataSource={updateDataSource}
      dataChange={dataChange}
      width={size.width}
      height={size.height}
      renderReady={_renderReady}
      dataSource={dataSource}
      openEntity={openEntity}
      data={data}
      tabKey={tabKey}
      activeKey={activeKey}
      common={common}
      scaleChange={scaleChange}
      tabDataChange={tabDataChange}
      changes={changes}
      versionsData={versionsData}
      save={save}
      relationType={currentRelation?.relationType}
      getDataSource={getDataSource}
      openDict={openDict}
      selectionChanged={selectionChanged}
      jumpEntity={jumpEntity}
      diagramKey={diagramKey}
    />
  </div>;
});

export default Relation;
