import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import { Button, Space } from 'antd';
import ReactResizeDetector from 'react-resize-detector';
import 'react-mosaic-component/react-mosaic-component.css';

import { validate } from 'uuid';
import { createProject, loadProjects } from '../../redux/actions/projects';
import { loadExperiments } from '../../redux/actions/experiments';

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
  const {
    activeProjectUuid,
    loading: projectsLoading,
  } = useSelector((state) => state.projects.meta);
  const experiments = useSelector((state) => state.experiments);
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);
  const activeProject = projectsList[activeProjectUuid];

  const existingExperiments = activeProject?.experiments
    .map((experimentId) => experiments[experimentId]);

  const experimentIds = new Set(experiments.ids);
  const experimentsAreLoaded = activeProject?.experiments
    .every((experimentId) => experimentIds.has(experimentId));
  const isUuid = (uuid) => {
    const substrings = uuid.split('-');

    // If UUID is prefixed with sandbox_id, remove prefix
    const projectUuid = substrings.length > 5 ? substrings.slice(-5).join('-') : uuid;

    return validate(projectUuid);
  };

  // const experimentsAreLoaded = (project, experiments) => {}
  useEffect(() => {
    if (projectsList.ids.length === 0) dispatch(loadProjects());
  }, []);

  useEffect(() => {
    // old experiments don't have a project so the activeProjectUuid will actually be an experiment
    // ID so the experiments load will fail this should be addressed by migrating experiments
    // for now, if the activeProjectUuid is not a Uuid it means that it's an old experiment
    // and we should not try to load the experiments with it
    if (!activeProjectUuid || experimentsAreLoaded || !isUuid(activeProjectUuid)) return;

    dispatch(loadExperiments(activeProjectUuid));
  }, [activeProject]);

  useEffect(() => {
    if (projectsLoading === true) {
      return;
    }
    if (projectsList.ids.length === 0) {
      setNewProjectModalVisible(true);
    } else {
      setNewProjectModalVisible(false);
    }
  }, [projectsList, projectsLoading]);

  const unnamedExperimentName = 'Unnamed Analysis';

  const createNewProject = (newProjectName, newProjectDescription) => {
    const numUnnamedExperiments = !existingExperiments?.[0] ? 0
      : existingExperiments.filter((experiment) => experiment.name.match(`${unnamedExperimentName} `)).length;
    const newExperimentName = `${unnamedExperimentName} ${numUnnamedExperiments + 1}`;

    dispatch(createProject(newProjectName, newProjectDescription, newExperimentName));
    setNewProjectModalVisible(false);
  };

  const TILE_MAP = {
    'Projects List': {
      toolbarControls: [],
      component: (width, height) => (
        <Space
          direction='vertical'
          style={{ width: '100%' }}
        >
          <Button type='primary' block onClick={() => setNewProjectModalVisible(true)}>
            Create New Project
          </Button>
          <Space direction='vertical' style={{ width: '100%', overflowY: 'scroll' }}>
            <ProjectsListContainer height={height} />
          </Space>
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
      <LoadingModal
        visible={Boolean(projectSaving || sampleSaving)}
        message={projectSaving ?? sampleSaving ?? ''}
      />

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
