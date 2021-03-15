import React from 'react';
import PropTypes from 'prop-types';
import {
  Popover, Button, Space, Divider,
} from 'antd';
import { FormatPainterOutlined } from '@ant-design/icons';

const MetadataEditor = (props) => {
  const {
    onCreate, onCancel, children, massEdit, ...restOfProps
  } = props;

  const getContent = () => (
    <Space direction='vertical'>
      {children}
      <Divider style={{ margin: '4px 0' }} />

      {massEdit
        ? (
          <Space>
            <Button type='primary' size='small'>Fill all missing</Button>
            <Button size='small'>Replace all</Button>
            <Button type='warning' size='small'>Clear all</Button>
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
    <Popover title='Fill metadata' content={getContent()} placement='bottom'>
      <Button size='small' shape='circle' icon={<FormatPainterOutlined />} {...restOfProps} />
    </Popover>
  );
  /* eslint-enable react/jsx-props-no-spreading */
};

MetadataEditor.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default MetadataEditor;
