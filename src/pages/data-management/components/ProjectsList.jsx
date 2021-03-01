import React from 'react';
import PropTypes from 'prop-types';
import { Button, Space } from 'antd';

const ProjectsList = (props) => {
  const { width, height, onClick } = props;
  return (
    <div width={width} height={height}>
      <Button type='primary' block onClick={onClick}>
        Create New Project
      </Button>
    </div>
  );
};

ProjectsList.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ProjectsList;
