import React from 'react';
import {Button, CodeEditor, FormatMessage, openModal} from 'components';
import Preview from '../../container/database/Preview';
// eslint-disable-next-line import/named
import { platform } from '../../../lib/middle';

export default ({prefix, data, onBlur, update, dataSource, type, name}) => {
    const openOptModal = (t) => {
        let modal = null;
        let cacheTemplate = data;
        const templateChange = (tempValue) => {
            cacheTemplate = tempValue;
        };
        const onOk = () => {
            update((c) => {
                return {
                    ...c,
                    [type]: cacheTemplate,
                };
            });
            modal && modal.close();
        };
        const onCancel = () => {
            modal && modal.close();
        };
        if (t === 'previewEdit') {
            modal = openModal(<Preview
              dataSource={dataSource}
              template={data}
              db={name}
              mode='java'
              templateShow={type}
              templateChange={templateChange}
            />, {
                fullScreen: true,
                title: FormatMessage.string({id: 'database.templateEditOpt.previewEdit'}),
                buttons: [<Button type='primary' key='ok' onClick={onOk}>
                  <FormatMessage id='button.ok'/>
                </Button>,
                  <Button key='cancel' onClick={onCancel}>
                    <FormatMessage id='button.cancel'/>
                  </Button>],
            });
        } else {
            const href = 'https://gitee.com/robergroup/chiner-hub/tree/master/CodeTemplate';
            if (platform === 'json') {
                // eslint-disable-next-line global-require,import/no-extraneous-dependencies
                require('electron').shell.openExternal(href);
            } else {
                const a = document.createElement('a');
                a.href = href;
                a.click();
            }
        }
    };
    return <div className={`${prefix}-code-editor-content`}>
      <div className={`${prefix}-code-editor-content-opt`}>
        <span
          onClick={() => openOptModal('previewEdit')}
      >
          <FormatMessage id='database.templateEditOpt.previewEdit'/>
        </span>
        <span
          onClick={() => openOptModal('getTemplateByDefaultOrRemote')}
            >
          <FormatMessage id='database.templateEditOpt.getTemplateByDefaultOrRemote'/>
        </span>
      </div>
      <div>
        <CodeEditor value={data} blur={onBlur} width='auto' height='calc(100vh - 180px)'/>
      </div>
    </div>;
};
