/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Popover, Button, Space, Divider, Tooltip,
} from 'antd';
import { FormatPainterOutlined } from '@ant-design/icons';

const MetadataEditor = (props) => {
  const {
    onReplaceEmpty,
    onReplaceAll,
    onClearAll,
    massEdit,
    children,
    ...restOfProps
  } = props;

  const [value, setValue] = useState('');

  const onChange = (e) => {
    setValue(e?.target?.value || e);
  };

  const getContent = () => (
    <Space direction='vertical'>
      {React.cloneElement(children, {
        onChange,
        value,
      })}
      <Divider style={{ margin: '4px 0' }} />

      {massEdit
        ? (
          <Space>
            <Button
              type='primary'
              size='small'
              onClick={() => onReplaceEmpty(value)}
            >
              Fill all missing

            </Button>
            <Button size='small' onClick={() => onReplaceAll(value)}> Replace all</Button>
            <Button type='warning' size='small' onClick={() => onClearAll()}> Clear all</Button>
          </Space>
        )
        : (
          <Space>
            <Button type='primary' size='small'>Save</Button>
            <Button size='small'>Cancel</Button>
          </Space>
        )}
    </Space>
  );

  return (
    <Tooltip title='Fill'>
      <Popover title='Fill metadata' content={getContent()} trigger='click'>
        <Button size='small' shape='circle' icon={<FormatPainterOutlined />} {...restOfProps} />
      </Popover>
    </Tooltip>
  );
  /* eslint-enable react/jsx-props-no-spreading */
};

MetadataEditor.propTypes = {
  onReplaceEmpty: PropTypes.func.isRequired,
  onReplaceAll: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  massEdit: PropTypes.bool,
};

MetadataEditor.defaultProps = {
  massEdit: false,
};

export default MetadataEditor;
