import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Card, Space, Descriptions,
} from 'antd';
import { blue } from '@ant-design/colors';
import EditableField from '../EditableField';

// eslint-disable-next-line import/no-extraneous-dependencies

import ProjectDeleteModal from './ProjectDeleteModal';
import FileUploadModal from './FileUploadModal';
import { setActiveProject, updateProject, deleteProject as deleteProjectAction } from '../../redux/actions/projects';
import PrettyTime from '../PrettyTime';

import processUpload from '../../utils/processUpload';
import validateInputs, { rules } from '../../utils/validateInputs';

const ProjectsListContainer = (props) => {
  const { height } = props;
  const dispatch = useDispatch();

  const samples = useSelector((state) => state.samples);
  const projects = useSelector((state) => state.projects);
  const { activeProjectUuid } = projects.meta;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteProjectUuid, setDeleteProjectUuid] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [projectNames, setProjectNames] = useState(new Set());

  useEffect(() => {
    setProjectNames(new Set(projects.ids.map((id) => projects[id].name.trim())));
  }, [projects.ids]);

  const activeProjectStyle = {
    backgroundColor: blue[0],
    cursor: 'pointer',
    border: `2px solid ${blue.primary}`,
  };

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  const deleteProject = () => {
    dispatch(deleteProjectAction(deleteProjectUuid));
    setDeleteModalVisible(false);
  };

  const validationChecks = [
    rules.MIN_8_CHARS,
    rules.MIN_2_SEQUENTIAL_CHARS,
    rules.ALPHANUM_DASH_SPACE,
    rules.UNIQUE_NAME,
  ];

  const validationParams = {
    existingNames: projectNames,
  };

  return (
    <>
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => { setUploadModalVisible(false); }}
        onUpload={uploadFiles}
      />
      <ProjectDeleteModal
        visible={deleteModalVisible}
        onCancel={() => { setDeleteModalVisible(false); }}
        onDelete={deleteProject}
        projectName={projects[deleteProjectUuid]?.name}
      />

      <Space direction='vertical' style={{ width: '100%', height: height - 90 }}>
        {
          projects.ids.map((uuid) => (
            <Card
              key={uuid}
              type='primary'
              style={activeProjectUuid === uuid ? activeProjectStyle : { cursor: 'pointer' }}

              onClick={() => {
                dispatch(setActiveProject(uuid));
              }}
            >
              <Descriptions
                layout='horizontal'
                size='small'
                column={1}
                colon=''
                title={(
                  <EditableField
                    value={projects[uuid].name}
                    onAfterSubmit={(name) => {
                      dispatch(updateProject(uuid, { name }));
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      setDeleteProjectUuid(uuid);
                      setDeleteModalVisible(true);
                    }}
                    validationFunc={
                      (name) => validateInputs(
                        name,
                        validationChecks,
                        validationParams,
                      ).isValid
                    }
                  />
                )}
              >
                <Descriptions.Item
                  labelStyle={{ fontWeight: 'bold' }}
                  label='Samples'
                >
                  {projects[uuid].samples.length}

                </Descriptions.Item>
                <Descriptions.Item
                  labelStyle={{ fontWeight: 'bold' }}
                  label='Created'
                >
                  <PrettyTime isoTime={projects[uuid].createdDate} />

                </Descriptions.Item>
                <Descriptions.Item
                  labelStyle={{ fontWeight: 'bold' }}
                  label='Modified'
                >
                  <PrettyTime isoTime={projects[uuid].lastModified} />

                </Descriptions.Item>
                <Descriptions.Item
                  labelStyle={{ fontWeight: 'bold' }}
                  label='Last analyzed'
                >
                  {projects[uuid].lastAnalyzed ? (
                    <PrettyTime isoTime={projects[uuid].lastAnalyzed} />
                  ) : ('never')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ))
        }
      </Space>
    </>
  );
};

ProjectsListContainer.propTypes = {
  height: PropTypes.number,
};

ProjectsListContainer.defaultProps = {
  height: 800,
};

export default ProjectsListContainer;
