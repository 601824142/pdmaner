import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {FormatMessage, GroupIcon, Icon, SearchSuggest, Slider, NumberInput, Modal} from 'components';
import { SketchPicker } from 'react-color';
import numeral from 'numeral';
import {validateNeedSave} from '../../lib/datasource_util';

const GroupIconGroup = GroupIcon.GroupIconGroup;

export default React.memo(forwardRef(({currentPrefix, close, iconClick, colorChange, openModal,
                                        activeTab, resize, sliderChange, dataSource,
                                        jumpPosition, jumpDetail}, ref) => {
  const [isCellSelected, setIsCellSelected] = useState(false);
  const [scaleNumber, setScaleNumber] = useState(1);
  const [colorState, setColor] = useState({
    fontColor: 'rgba(0, 0, 0, 0.65)',
    fillColor: '#ACDAFC',
  });
  useImperativeHandle(ref, () => {
    return {
      setScaleNumber,
      setIsCellSelected,
    };
  }, []);
  const _colorChange = (key, value) => {
    setColor((pre) => {
      return {
        ...pre,
        [key]: value.hex,
      };
    });
    colorChange && colorChange(key, value);
  };
  const _close = () => {
    if (validateNeedSave(dataSource)) {
      Modal.confirm({
        title: FormatMessage.string({id: 'closeConfirmTitle'}),
        message: FormatMessage.string({id: 'closeConfirm'}),
        onOk:() => {
          close();
        },
      });
    } else {
      close();
    }
  };
  return <div className={`${currentPrefix}-head`}>
    <div className={`${currentPrefix}-head-logo`}>
      <div className={`${currentPrefix}-head-logo-opt`}>
        <span>
          <Icon type='fa-angle-left' onClick={_close}/>
        </span>
        <span>{dataSource.name}</span>
      </div>
    </div>
    <GroupIconGroup>
      <GroupIcon
        dropType='icon'
        groupKey='save'
        title={FormatMessage.string({id: 'toolbar.save'})}
        icon='icon-bianzu2'
        onClick={iconClick}
        dropMenu={[
            /*{ key: 'save', name: FormatMessage.string({id: 'toolbar.save'})},*/
            { key: 'saveAs', name: FormatMessage.string({id: 'toolbar.saveAs'})},
          ]}/>
      <GroupIcon
        className={`${currentPrefix}-head-db`}
        title={FormatMessage.string({id: 'toolbar.refresh'})}
        onClick={() => iconClick(null, 'refresh')}
        icon='fa-refresh'
      />
      <GroupIcon
        title={FormatMessage.string({id: 'toolbar.undo'})}
        onClick={() => iconClick(null, 'undo')}
        icon='icon-bianzu4'
        disable={activeTab?.type !== 'diagram'}
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
      />
      <GroupIcon
        onClick={() => iconClick(null, 'redo')}
        title={FormatMessage.string({id: 'toolbar.redo'})}
        icon='icon-bianzu3'
        disable={activeTab?.type !== 'diagram'}
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
      />
      {/* eslint-disable-next-line max-len */}
      {/*<GroupIcon title={FormatMessage.string({id: 'toolbar.opt'})} icon='opt.svg' dropMenu={[]}/>*/}
    </GroupIconGroup>
    <GroupIconGroup>
      <GroupIcon
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
        title={FormatMessage.string({id: 'toolbar.emptyEntity'})}
        icon='icon-kongbiao'
        disable={activeTab?.type !== 'diagram'}
        //style={{cursor: 'move'}}
        onClick={iconClick}
        groupKey='empty'
        //onMouseDown={e => iconClick(e, 'empty')}
      />
      <GroupIcon
        className={`${currentPrefix}-head-db`}
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
        title={FormatMessage.string({id: 'toolbar.group'})}
        icon='fa-object-group'
        //style={{cursor: 'move'}}
        onClick={iconClick}
        groupKey='group'
        disable={activeTab?.type !== 'diagram'}
        //onMouseDown={e => iconClick(e, 'group')}
      />
      <GroupIcon
        topStyle={{height: '24px'}}
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
        dropType='icon'
        groupKey='rect'
        disable={activeTab?.type !== 'diagram'}
        title={FormatMessage.string({id: 'toolbar.rect'})}
        icon='fa-square-o'
        onClick={iconClick}
        dropMenu={[
          { key: 'round', name: FormatMessage.string({id: 'toolbar.round'})},
          { key: 'circle', name: FormatMessage.string({id: 'toolbar.circle'})},
        ]}/>
      <GroupIcon
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
        title={FormatMessage.string({id: 'toolbar.polygon'})}
        //style={{cursor: 'move'}}
        icon={<div className={`${currentPrefix}-head-rect`}>
          <span>{}</span>
        </div>}
        groupKey='polygon'
        onClick={iconClick}
        disable={activeTab?.type !== 'diagram'}
        //onMouseDown={e => iconClick(e, 'polygon')}
      />
      <GroupIcon
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
        title={FormatMessage.string({id: 'toolbar.fontColor'})}
        icon={<div className={`${currentPrefix}-head-font`}>
          <span><Icon type='icon-zitiyanse'/></span>
        </div>}
        dropMenuStyle={{
            left: -59,
            top: 53,
          }}
        dropMenu={<SketchPicker
          disableAlpha
          presetColors={['#FFFFFF', '#BFBFBF', '#C00000', '#FFC000', '#F6941D', '#7030A0', '#136534', '#0070C0',
          '#0D0D0D','#6698CC', '#FA5A5A', '#FFD966', '#F8CBAD', '#CB99C5', '#9ACC98', '#093299']}
          color={colorState.fontColor}
          onChange={color => _colorChange('fontColor', color)}
          />}
        disable={activeTab?.type !== 'diagram' || !isCellSelected}
      />
      <GroupIcon
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
        title={FormatMessage.string({id: 'toolbar.fillColor'})}
        icon='icon-tianchongyanse'
        dropMenuStyle={{
            left: -59,
            top: 53,
          }}
        dropMenu={<SketchPicker
          disableAlpha
          presetColors={['#FFFFFF', '#BFBFBF', '#C00000', '#FFC000', '#F6941D', '#7030A0', '#136534', '#0070C0',
            '#0D0D0D','#6698CC', '#FA5A5A', '#FFD966', '#F8CBAD', '#CB99C5', '#9ACC98', '#093299']}
          color={colorState.fillColor}
          onChange={color => _colorChange('fillColor', color)}
          />}
        disable={activeTab?.type !== 'diagram' || !isCellSelected}
      />
    </GroupIconGroup>
    <GroupIconGroup>
      <GroupIcon
        hoverTitle={activeTab?.type !== 'diagram' ? FormatMessage.string({id: 'toolbar.relationEnableTitle'}) : ''}
        disable={activeTab?.type !== 'diagram'}
        title={FormatMessage.string({id: 'toolbar.scale'})}
        icon={<>
          <span className={`${currentPrefix}-head-scale
           ${currentPrefix}-head-scale-${activeTab?.type !== 'diagram' ? 'disable' : 'normal'}`}>
            <Icon type='fa-minus' onClick={() => resize(-0.1)}/>
            <span>
              <NumberInput
                readOnly={activeTab?.type !== 'diagram'}
                onBlur={e => sliderChange(numeral(e.target.value).divide(2).value())}
                min={0}
                max={200}
                value={parseInt(numeral(scaleNumber).multiply(100).value(), 10)}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
              />
            </span>
            <Icon type='fa-plus ' onClick={() => resize(0.1)}/>
          </span>
          <div>
            <Slider disable={activeTab?.type !== 'diagram'} onChange={sliderChange} value={numeral(scaleNumber).multiply(50).value()}/>
          </div>
        </>}
      />
      <GroupIcon
        title={FormatMessage.string({id: 'toolbar.import'})}
        onClick={iconClick}
        icon={<Icon type='icon-daoru'/>}
        dropMenu={[
            { key: 'pdman', name: FormatMessage.string({id: 'toolbar.importPDMan'}) },
            { key: 'chiner', name: FormatMessage.string({id: 'toolbar.importCHNR'}) },
            { key: 'powerdesigner', name: FormatMessage.string({id: 'toolbar.importPowerDesigner'}) },
            { key: 'db', name: FormatMessage.string({id: 'toolbar.importDb'}) },
            { key: 'importDDL', name: FormatMessage.string({id: 'toolbar.importDDL'}) },
            { style: { borderTop: '1px solid #DFE3EB' },
              key: 'domains',
              name: FormatMessage.string({id: 'toolbar.importDomains'}),
            },
            { key: 'importConfig', name: FormatMessage.string({id: 'toolbar.importConfig'}) },
        ]}
      />
      <GroupIcon
        onClick={iconClick}
        title={FormatMessage.string({id: 'toolbar.export'})}
        icon={<Icon type='icon-daochu'/>}
        dropMenu={[
            {key: 'word', name: FormatMessage.string({id: 'toolbar.exportWord'})},
            {key: 'sql', name: FormatMessage.string({id: 'toolbar.exportSql'})},
            {key: 'dict', name: FormatMessage.string({id: 'toolbar.exportDict'})},
            {
              key: 'img',
              name: FormatMessage.string({id: 'toolbar.exportImg'}),
              disable: activeTab?.type !== 'diagram',
            },
            {
              style: { borderTop: '1px solid #DFE3EB' },
              key: 'exportDomains',
              name: FormatMessage.string({id: 'toolbar.exportDomains'}),
            },
            { key: 'exportConfig', name: FormatMessage.string({id: 'toolbar.exportConfig'}) },
          ]}
      />
      <GroupIcon title={FormatMessage.string({id: 'toolbar.setting'})} icon='icon-shezhi' onClick={() => openModal('config')}/>
      <GroupIcon className={`${currentPrefix}-head-db`} title={FormatMessage.string({id: 'toolbar.dbConnect'})} icon='fa-database' onClick={() => openModal('dbConnect')}/>
    </GroupIconGroup>
    <div className={`${currentPrefix}-head-search`}>
      <SearchSuggest
        jumpPosition={jumpPosition}
        jumpDetail={jumpDetail}
        placeholder={FormatMessage.string({id: 'toolbar.search'})}
        dataSource={dataSource}
      />
    </div>
  </div>;
}));
