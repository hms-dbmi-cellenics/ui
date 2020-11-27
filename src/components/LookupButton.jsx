import React from 'react';
import { Tooltip, Button } from 'antd';
import { EyeTwoTone, EyeOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const LookupButton = (props) => {
  const { focused, onClick } = props;

  return (
    <Tooltip placement='right' title='Visualize on embedding'>
      <Button type='dashed' style={{ background: 'none' }} size='small' onClick={onClick}>
        {focused
          ? (<EyeTwoTone style={{ cursor: 'pointer' }} />)
          : (<EyeOutlined style={{ cursor: 'pointer' }} />)}
      </Button>
    </Tooltip>
  );
};

LookupButton.defaultProps = {
  onClick: () => null,
};

LookupButton.propTypes = {
  focused: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
};

export default LookupButton;
