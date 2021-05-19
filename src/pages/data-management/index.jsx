import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import { Button, Space } from 'antd';
import ReactResizeDetector from 'react-resize-detector';
import 'react-mosaic-component/react-mosaic-component.css';

import { createProject } from '../../redux/actions/projects';

import Header from '../../components/Header';
import NewProjectModal from '../../components/data-management/NewProjectModal';
import ProjectsListContainer from '../../components/data-management/ProjectsListContainer';
import ProjectDetails from '../../components/data-management/ProjectDetails';
import LoadingModal from '../../components/LoadingModal';

const DataManagementPage = ({ route }) => {
  const dispatch = useDispatch();
  const projectsList = useSelector(((state) => state.projects));
  const {
    saving: projectSaving,
  } = projectsList.meta;
  const {
    saving: sampleSaving,
  } = useSelector((state) => state.samples.meta);
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(true);
  const projects = useSelector((state) => state.projects);
  const experiments = useSelector((state) => state.experiments);
  const activeProjectUuid = useSelector((state) => state.projects.meta.activeProjectUuid);
  const activeProject = projects[activeProjectUuid];

  const existingExperiments = activeProject?.experiments
    .map((experimentId) => experiments[experimentId]);

  useEffect(() => {
    if (projectsList.ids.length) {
      setNewProjectModalVisible(false);
    }
  }, [projectsList]);

  const unnamedExperimentName = 'Unnamed Analysis';

  const createNewProject = (newProjectName, newProjectDescription) => {
    const numUnnamedExperiments = !existingExperiments ? 0
      : existingExperiments.filter((experiment) => experiment.name.match(`${unnamedExperimentName} `)).length;
    const newExperimentName = `${unnamedExperimentName} ${numUnnamedExperiments + 1}`;

    dispatch(createProject(newProjectName, newProjectDescription, newExperimentName));
    setNewProjectModalVisible(false);
  };

  const TILE_MAP = {
    'Projects List': {
      toolbarControls: [],
      component: (width, height) => (
        <Space direction='vertical' style={{ width: '100%', overflowY: 'scroll' }}>
          <Button type='primary' block onClick={() => setNewProjectModalVisible(true)}>
            Create New Project
          </Button>
          <ProjectsListContainer height={height} />
        </Space>
      ),
    },
    'Data Management': {
      toolbarControls: [],
      component: (width, height) => (
        <ProjectDetails width={width} height={height} />
      ),
    },
  };

  const windows = {
    direction: 'row',
    first: 'Projects List',
    second: 'Data Management',
    splitPercentage: 23,
  };

  const renderWindow = (tile, width, height) => {
    if (tile) {
      return (
        <div style={{ padding: '10px' }}>
          {height && width ? tile(width, height) : <></>}
        </div>
      );
    }
    return <></>;
  };

  return (
    <>
      <Header
        route={route}
        title='Data Management'
      />
      {/* <LoadingModal
        visible={projectSaving || sampleSaving}
        message={projectSaving || sampleSaving || ''}
      /> */}
      <NewProjectModal
        visible={newProjectModalVisible}
        firstTimeFlow={projectsList.ids.length === 0}
        onCancel={() => { setNewProjectModalVisible(false); }}
        onCreate={createNewProject}
        projects={projectsList}
      />
      <div style={{ height: '100%', width: '100%', margin: 0 }}>
        <Mosaic
          renderTile={(id, path) => (
            <ReactResizeDetector
              handleWidth
              handleHeight
              refreshMode='throttle'
              refreshRate={500}
            >
              {({ width, height }) => (
                <MosaicWindow
                  path={path}
                  title={id}
                  toolbarControls={TILE_MAP[id].toolbarControls}
                >
                  {renderWindow(TILE_MAP[id].component, width, height)}
                </MosaicWindow>
              )}
            </ReactResizeDetector>
          )}
          initialValue={windows}
        />
      </div>
    </>
  );
};

DataManagementPage.propTypes = {
  route: PropTypes.string.isRequired,
};

export default DataManagementPage;
