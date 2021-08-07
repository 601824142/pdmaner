import React, { useMemo } from 'react';
import AceEditor from 'react-ace';

// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/webpack-resolver';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/mode-json';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/snippets/json';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/mode-java';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/snippets/java';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/theme-monokai';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/mode-sql';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/snippets/sql';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/ext-language_tools';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'ace-builds/src-noconflict/ext-searchbox';

export default React.memo(({mode = 'sql', theme = 'monokai', value, onChange,
                             height, width, focus, firstLine, readOnly, onLoad}) => {
  const name = useMemo(() => Math.uuid(), []);
  const _onLoad = (ace) => {
    focus && ace.focus();
    firstLine && ace.selection.moveCursorTo(0, 0);
    onLoad && onLoad(ace);
  };
  const _onChange = (data) => {
    onChange && onChange({
      target: {
        value: data,
      },
    });
  };
  const _onKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.stopPropagation();
    }
  };
  return <div onKeyDown={_onKeyDown}>
    <AceEditor
      fontSize={14}
      height={height}
      width={width}
      mode={(mode || '').toLocaleLowerCase()}
      theme={theme}
      name={name}
      onChange={_onChange}
      value={value}
      enableBasicAutocompletion
      enableLiveAutocompletion
      onLoad={_onLoad}
      readOnly={readOnly}
    />
  </div>;
});
