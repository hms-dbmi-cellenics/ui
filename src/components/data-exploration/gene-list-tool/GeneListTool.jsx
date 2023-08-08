import React, { useState, useEffect, useRef } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { loadPaginatedGeneProperties } from 'redux/actions/genes';
import GeneTable from '../generic-gene-table/GeneTable';

const GeneListTool = (props) => {
  const {
    experimentId, width, height, uuid,
  } = props;

  const [tableUuid] = useState(uuid);

  const dispatch = useDispatch();
  const properties = useSelector((state) => state.genes.properties.data);
  const propertiesLoading = useSelector((state) => state.genes.properties.loading);

  const viewState = useSelector((state) => state.genes.properties.views[tableUuid]);
  const error = useSelector((state) => state.genes.properties.views[tableUuid]?.error);
  const componentFetching = useSelector(
    (state) => state.genes.properties.views[tableUuid]?.fetching,
  );
  const tableRowKeys = useSelector((state) => state.genes.properties.views[tableUuid]?.data);
  const total = useSelector((state) => state.genes.properties.views[tableUuid]?.total);

  const initialLoad = useRef(true);

  const PROPERTIES = ['dispersions'];

  // aka tableRows
  const [dataShown, setDataShown] = useState([]);

  const isTableLoading = () => {
    // Load if the view is not yet created (pre-dispatch).
    if (!viewState) {
      return true;
    }

    // Load if the view is actively fetching (post-dispatch, pre-result).
    if (componentFetching) {
      return true;
    }

    // Load if anything is updating the properties we are listening for.
    if (_.intersection(PROPERTIES, propertiesLoading).length > 0) {
      return true;
    }

    return false;
  };

  const columns = [
    {
      fixed: 'left',
      title: 'Dispersion',
      key: 'dispersions',
      sorter: true,
      showSorterTooltip: {
        title: `Dispersion describes how much the variance deviates from the mean.
      Genes with high dispersion have a high level of variation between cells in the dataset.`,
      },
      render: (num) => parseFloat(num.toFixed(3)),
    },
  ];

  const loadData = (loadAllState) => {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, tableUuid, loadAllState));
  };

  // When data changes, update rows.
  useEffect(() => {
    if (!tableRowKeys || tableRowKeys.length === 0) {
      return;
    }

    const newRows = [];

    tableRowKeys.forEach((key) => {
      newRows.push({
        gene_names: key,
        dispersions: properties[key].dispersions,
      });
    });

    setDataShown(newRows);

    initialLoad.current = false;
  }, [tableRowKeys]);

  return (
    <GeneTable
      experimentId={experimentId}
      initialTableState={{
        sorter: {
          field: 'dispersions',
          columnKey: 'dispersions',
          order: 'descend',
        },
      }}
      columns={columns}
      loading={isTableLoading()}
      error={error || false}
      propData={dataShown}
      loadData={loadData}
      width={width}
      height={height}
    />
  );
};

GeneListTool.defaultProps = {
  uuid: uuidv4(),
};

GeneListTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
  uuid: PropTypes.string,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default GeneListTool;
