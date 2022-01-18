import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Space, Select,
} from 'antd';
import { useSelector } from 'react-redux';
import SelectionActions from './SelectionActions';

const GeneSelectionMenu = (props) => {
  const { experimentId, extraOptions } = props;
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [listed, setListed] = useState(false);

  const onListSelected = (flag) => { setListed(flag); };

  return (

    <Space direction='vertical' style={{ width: '100%' }}>
      <SelectionActions
        experimentId={experimentId}
        extraOptions={extraOptions}
        onListSelected={onListSelected}
      />
      {listed ? (
        <>
          <Select
            value={selectedGenes}
            mode='multiple'
            showArrow={false}
            removeIcon={(<div />)}
            style={{ width: '100%' }}
          />
        </>
      ) : (<></>)}
    </Space>
  );
};

GeneSelectionMenu.defaultProps = {
  extraOptions: null,
};

GeneSelectionMenu.propTypes = {
  experimentId: PropTypes.string.isRequired,
  extraOptions: PropTypes.node,
};

export default GeneSelectionMenu;
