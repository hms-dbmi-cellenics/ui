import React, { useState } from 'react';
import {
  Space, Button,
} from 'antd';
import PropTypes from 'prop-types';

import ProjectSearchBox from './ProjectSearchBox';
import ProjectsList from './ProjectsList';

import integrationTestConstants from '../../utils/integrationTestConstants';

const ProjectsListContainer = (props) => {
  const { height, onCreateNewProject } = props;

  const [filterParam, setFilterParam] = useState(new RegExp('.*', 'i'));

  return (
    <Space direction='vertical' style={{ padding: '10px', width: '100%' }}>
      <Button
        data-test-id={integrationTestConstants.ids.CREATE_NEW_PROJECT_BUTTON}
        type='primary'
        block
        onClick={() => onCreateNewProject()}
      >
        Create New Project
      </Button>
      <ProjectSearchBox onChange={(searchRegex) => setFilterParam(searchRegex)} />
      <ProjectsList height={height} filter={filterParam} />
    </Space>
  );
};

ProjectsListContainer.propTypes = {
  height: PropTypes.number.isRequired,
  onCreateNewProject: PropTypes.func.isRequired,
};

export default ProjectsListContainer;
