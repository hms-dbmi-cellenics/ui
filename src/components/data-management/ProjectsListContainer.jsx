import React, { useState, useCallback } from 'react';
import {
  Space, Tooltip, Input, Skeleton,
} from 'antd';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';

import ProjectsList from './ProjectsList';

const ProjectsListContainer = (props) => {
  const { height } = props;

  const loading = useSelector((state) => state.projects.meta.loading);
  const [filterParam, setFilterParam] = useState('');

  const debouncedSetFilterParam = useCallback(
    _.debounce((value) => {
      setFilterParam(new RegExp(value, 'i'));
    }, 400),
    [],
  );

  if (loading) {
    return Array(5).fill(<Skeleton role='progressbar' active />);
  }

  return (
    <Space
      direction='vertical'
      style={{ width: '100%' }}
    >
      <Tooltip title='To search, insert project name, project ID or analysis ID here' placement='right'>
        <Input placeholder='Filter by project name, project ID or analysis ID' onChange={(e) => debouncedSetFilterParam(e.target.value)} />
      </Tooltip>
      <Space direction='vertical' style={{ width: '100%', overflowY: 'auto' }}>
        <ProjectsList height={height} filter={filterParam} />
      </Space>
    </Space>
  );
};

ProjectsListContainer.propTypes = {
  height: PropTypes.number.isRequired,
};

export default ProjectsListContainer;
