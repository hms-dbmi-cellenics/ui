import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Input, Modal, Space } from 'antd';

const SubsetCellSetsModal = (props) => {
  const {
    experimentName, onCancel, onOk,
  } = props;

  const defaultName = `Subset of ${experimentName}`;
  const subsetExperimentName = useRef(defaultName);

  return (
    <Modal
      data-testid='subsetCellSetsModal'
      title='Subset cell sets'
      okText='Create'
      visible
      onOk={() => { onOk(subsetExperimentName.current); }}
      cancelText='Cancel'
      onCancel={onCancel}
    >
      <p>
        This action will create a new project containing cells only from the selected cell sets.
      </p>
      <Space>
        <span>New project name</span>
        <Input
          aria-label='Subset experiment name'
          defaultValue={defaultName}
          onChange={(e) => { subsetExperimentName.current = e.target.value; }}
        />
      </Space>
    </Modal>
  );
};

SubsetCellSetsModal.propTypes = {
  experimentName: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
};

SubsetCellSetsModal.defaultProps = {
  experimentName: '',
};

export default SubsetCellSetsModal;
