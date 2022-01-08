import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Space, Select,
} from 'antd';
import { useSelector } from 'react-redux';
import SelectionActions from './SelectionActions';

const GeneSelectionMenu = (props) => {
  const { onExportCSV, experimentId } = props;
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [listed, setListed] = useState(false);

  const onListSelected = (flag) => { setListed(flag); };

  return (

    <Space direction='vertical' style={{ width: '100%' }}>
      <SelectionActions
        experimentId={experimentId}
        showCSV={onExportCSV !== null}
        onExportCSV={onExportCSV}
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
  onExportCSV: () => null,
};

GeneSelectionMenu.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onExportCSV: PropTypes.func,
};

export default GeneSelectionMenu;
