import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadPaginatedGeneProperties } from 'redux/actions/genes';

// A custom hook to load highest dispersion genes for plot initial states
// Hide loadPaginatedGeneProperties implementation for sites without a gene table
const useHighestDispersionGenes = (experimentId, plotUuid, number) => {
  const geneDispersionsKey = 'dispersions';
  const dispatch = useDispatch();

  const loading = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.fetching,
  );
  const error = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.error,
  );
  const genes = useSelector(
    (state) => (state.genes.properties.views[plotUuid]?.data
      ? state.genes.properties.views[plotUuid]?.data.slice(0, number) : undefined),
  );

  const tableState = {
    pagination: {
      current: 1, pageSize: number, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: geneDispersionsKey, columnKey: geneDispersionsKey, order: 'descend' },
  };

  const [reload, setReload] = useState(true);

  useEffect(() => {
    if (reload && !loading && !genes) {
      dispatch(loadPaginatedGeneProperties(
        experimentId, [geneDispersionsKey], plotUuid, tableState,
      ));
      setReload(false);
    }
  }, [reload]);

  return {
    highestDispersionGenes: genes ?? [],
    highestDispersionLoading: loading,
    highestDispersionError: error,
    setReloadHighestDispersion: setReload,
  };
};

export default useHighestDispersionGenes;
