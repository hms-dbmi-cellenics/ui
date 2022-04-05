import React, { useState } from 'react';
import {
  Space, Button,
} from 'antd';
import PropTypes from 'prop-types';
import { layout } from 'utils/constants';

import integrationTestConstants from 'utils/integrationTestConstants';
import ProjectSearchBox from './ProjectSearchBox';
import ProjectsList from './ProjectsList';

const ProjectsListContainer = (props) => {
  const { height, onCreateNewProject } = props;

  const [filterParam, setFilterParam] = useState(new RegExp('.*', 'i'));

  return (
    <Space direction='vertical' style={{ width: '100%', padding: layout.PANEL_PADDING }}>
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
