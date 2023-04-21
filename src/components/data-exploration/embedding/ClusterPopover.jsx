import React from 'react';
import PropTypes from 'prop-types';
import { Popover } from 'antd';
import colorProvider from 'utils/styling/colorProvider';
import EditableField from '../../EditableField';

const ClusterPopover = (props) => {
  const {
    popoverPosition, onCreate, onCancel, message, children, ...restOfProps
  } = props;

  const getContent = () => (
    <EditableField
      onAfterSubmit={(e) => {
        onCreate(e, colorProvider.getColor());
      }}
      onAfterCancel={() => {
        onCancel();
      }}
      deleteEnabled={false}
      value='New Cluster'
      defaultEditing
    />
  );

  const content = getContent();

  let style = {};
  if (popoverPosition) {
    style = { position: 'absolute', left: popoverPosition.current.x + 20, top: popoverPosition.current.y + 20 };
  }

  /* eslint-disable react/jsx-props-no-spreading */
  if (!children) {
    return (
      <div style={style}>
        <Popover title={message} content={content} {...restOfProps} />
      </div>
    );
  }

  return (
    <div style={style}>
      <Popover
        title={message}
        content={content}
        {...restOfProps}

      >
        {children}
      </Popover>
    </div>
  );
  /* eslint-enable react/jsx-props-no-spreading */
};

ClusterPopover.defaultProps = {
  popoverPosition: null,
  message: 'Add cell set',
  children: null,
};

ClusterPopover.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  popoverPosition: PropTypes.object,
  children: PropTypes.object,
  message: PropTypes.string,
};

export default ClusterPopover;
