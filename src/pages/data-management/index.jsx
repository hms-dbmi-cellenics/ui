/* eslint-disable import/no-unresolved */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import {
  Button, Space, Empty, Typography,
} from 'antd';
import ReactResizeDetector from 'react-resize-detector';
import 'react-mosaic-component/react-mosaic-component.css';

import { ClipLoader } from 'react-spinners';
import { loadProjects } from '../../redux/actions/projects';
import { loadExperiments } from '../../redux/actions/experiments';

import Header from '../../components/Header';
import NewProjectModal from '../../components/data-management/NewProjectModal';
import ProjectsListContainer from '../../components/data-management/ProjectsListContainer';
import ProjectDetails from '../../components/data-management/ProjectDetails';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import loadBackendStatus from '../../redux/actions/backendStatus/loadBackendStatus';
import integrationTestIds from '../../utils/integrationTestIds';

const { Text } = Typography;

const DataManagementPage = ({ route }) => {
  const dispatch = useDispatch();
  const projectsList = useSelector(((state) => state.projects));

  const {
    saving: projectSaving,
  } = projectsList.meta;

  const sampleSaving = useSelector((state) => state.samples.meta.saving);

  const {
    activeProjectUuid,
    loading: projectsLoading,
  } = useSelector((state) => state.projects.meta);

  const experiments = useSelector((state) => state.experiments);
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(true);
  const activeProject = projectsList[activeProjectUuid];

  const experimentIds = new Set(experiments.ids);
  const experimentsAreLoaded = activeProject?.experiments
    .every((experimentId) => experimentIds.has(experimentId));

  useEffect(() => {
    if (projectsList.ids.length === 0) dispatch(loadProjects());
  }, []);

  const updateRunStatus = async (experimentId) => {
    dispatch(loadBackendStatus(experimentId));
  };

  useEffect(() => {
    if (!activeProjectUuid) return;

    // Right now we have one experiment per project, so we can just load the experiment
    // This has to be changed when we have more than one experiment
    const activeExperimentId = projectsList[activeProjectUuid].experiments[0];

    dispatch(loadProcessingSettings(activeExperimentId));

    if (!experimentsAreLoaded) {
      dispatch(loadExperiments(activeProjectUuid)).then(() => updateRunStatus(activeExperimentId));
    }

    if (experiments[activeExperimentId]) updateRunStatus(activeExperimentId);
  }, [activeProjectUuid]);

  useEffect(() => {
    // only open the modal the first time a user logs in if there are no projects
    if (justLoggedIn === false || projectsLoading === true) {
      return;
    }

    setJustLoggedIn(false);

    if (projectsList.ids.length === 0) {
      setNewProjectModalVisible(true);
    }
  }, [projectsList, projectsLoading]);

  const createNewProject = () => {
    setNewProjectModalVisible(false);
  };

  const PROJECTS_LIST = 'Projects';
  const PROJECT_DETAILS = 'Project Details';

  const TILE_MAP = {
    [PROJECTS_LIST]: {
      toolbarControls: [],
      component: (width, height) => (
        <Space
          direction='vertical'
          style={{ width: '100%' }}
        >
          <Button
            data-test-id={integrationTestIds.id.CREATE_NEW_PROJECT_BUTTON}
            type='primary'
            block
            onClick={() => setNewProjectModalVisible(true)}
          >
            Create New Project
          </Button>
          <Space direction='vertical' style={{ width: '100%', overflowY: 'scroll' }}>
            <ProjectsListContainer height={height} />
          </Space>
        </Space>
      ),
    },
    [PROJECT_DETAILS]: {
      toolbarControls: [],
      component: (width, height) => {
        if (!activeProjectUuid) {
          return (
            <Empty
              description='You have no projects yet.'
            >
              <Button type='primary' onClick={() => setNewProjectModalVisible(true)}>Get started</Button>
            </Empty>
          );
        }

        return (<ProjectDetails width={width} height={height} />);
      },
    },
  };

  const windows = {
    direction: 'row',
    first: PROJECTS_LIST,
    second: PROJECT_DETAILS,
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
      {projectSaving || sampleSaving ? (
        <center>
          <Space direction='vertical'>
            <ClipLoader
              size={50}
              color='#8f0b10'
            />
            <Text>
              Loading...
            </Text>
          </Space>
        </center>
      ) : (<></>)}
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
