import React from 'react';
import { Button, Empty } from 'antd';
import PropTypes from 'prop-types';

const PlatformError = (props) => {
  const { description, onClick } = props;
  return (
    <Empty
      image={(
        <img
          alt='A woman with a paintbrush staring at an empty canvas (illustration).'
          src='/undraw_blank_canvas_3rbb.svg'
        />
      )}
      imageStyle={{
        height: 80,
      }}
      description={description || 'We\'re sorry, an error occurred. You may be able to try again.'}
    >
      <Button
        type='primary'
        onClick={onClick || window.location.reload()}
      >
        Try again
      </Button>

    </Empty>
  );
};

PlatformError.defaultProps = {
  onClick: null,
};

PlatformError.propTypes = {
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default PlatformError;
