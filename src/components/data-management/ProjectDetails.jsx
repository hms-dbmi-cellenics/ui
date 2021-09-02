/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Space } from 'antd';
import PropTypes from 'prop-types';
import SamplesTable from './SamplesTable';
// import '../../utils/css/data-management.css';
import ProjectMenu from './ProjectMenu';

const ProjectDetails = ({ width, height }) => (
  <div id='project-details' width={width} height={height}>
    <Space direction='vertical' style={{ width: '100%', padding: '8px 4px' }}>
      <ProjectMenu />
      <SamplesTable
        height={height}
      />
    </Space>
  </div>
);

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
