import React, { useState } from 'react';
import {
  Space, Button, Menu, Dropdown,
} from 'antd';
import PropTypes from 'prop-types';

import integrationTestConstants from 'utils/integrationTestConstants';
import ProjectSearchBox from './ProjectSearchBox';
import ProjectsList from './ProjectsList';

const ProjectsListContainer = (props) => {
  const { height, onCreateNewProject } = props;

  const [filterParam, setFilterParam] = useState(new RegExp('.*', 'i'));

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Dropdown
        overlay={() => (
          <Menu>
            <Menu.Item
              key='add-metadata-column'
              onClick={() => onCreateNewProject()}
            >
              Upload Project
            </Menu.Item>
            <Menu.Item
              key='upload-metadata-file'
              onClick={() => { console.log('Redirect to dataset repository'); }}
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
