import {
  Button,
  Space,
} from 'antd';
import React, { useState } from 'react';

import PropTypes from 'prop-types';
import integrationTestConstants from 'utils/integrationTestConstants';
import ProjectsList from './ProjectsList';
import ProjectSearchBox from './ProjectSearchBox';

const ProjectsListContainer = (props) => {
  const { height, onCreateNewProject } = props;

  const [filterParam, setFilterParam] = useState(new RegExp('.*', 'i'));

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Button
        data-test-id={integrationTestConstants.ids.CREATE_NEW_PROJECT_BUTTON}
        type='primary'
        block
        onClick={onCreateNewProject}
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
