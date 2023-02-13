import {
  Button,
  Dropdown,
  Menu,
  Space,
} from 'antd';
import React, { useState } from 'react';

import ProjectSearchBox from './ProjectSearchBox';
import ProjectsList from './ProjectsList';
import PropTypes from 'prop-types';
import integrationTestConstants from 'utils/integrationTestConstants';
import { modules } from 'utils/constants';
import { useAppRouter } from 'utils/AppRouteProvider';

const ProjectsListContainer = (props) => {
  const { height, onCreateNewProject } = props;

  const { navigateTo } = useAppRouter();
  const [filterParam, setFilterParam] = useState(new RegExp('.*', 'i'));

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Dropdown
        overlay={() => (
          <Menu>
            <Menu.Item
              key='upload_project'
              onClick={() => onCreateNewProject()}
            >
              Upload Project
            </Menu.Item>
            <Menu.Item
              key='copy_from_repository'
              onClick={() => { navigateTo(modules.REPOSITORY); }}
            >
              Select from Dataset Repository
            </Menu.Item>
          </Menu>
        )}
        trigger={['click']}
        placement='bottomRight'
      >
        <Button
          data-test-id={integrationTestConstants.ids.CREATE_NEW_PROJECT_BUTTON}
          type='primary'
          block
        >
          Create New Project
        </Button>
      </Dropdown>
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
