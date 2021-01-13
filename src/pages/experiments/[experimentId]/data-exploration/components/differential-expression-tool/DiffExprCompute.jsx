import React, { useState, useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Button, Form, Select, Typography, Radio, Empty,
} from 'antd';

import PropTypes from 'prop-types';
import _ from 'lodash';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';

import composeTree from '../../../../../../utils/composeTree';

const { Text } = Typography;

const { Option, OptGroup } = Select;

const ComparisonType = Object.freeze({ between: 'between', within: 'within' });

const DiffExprCompute = (props) => {
  const {
    experimentId, onCompute, cellSets, diffExprType,
  } = props;

  const dispatch = useDispatch();

  const properties = useSelector((state) => state.cellSets.properties);
  const hierarchy = useSelector((state) => state.cellSets.hierarchy);
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(cellSets);
  const [type, setType] = useState(diffExprType || ComparisonType.between);

  // `between sampoles/groups` makes no sense if there is no metadata. First,
  // assume there is and correct this if it's necessary.
  const [hasMetadata, setHasMetadata] = useState(false);

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (hierarchy.length === 0) return;

    // Make sure we are not rendering metadata-related options if there is no metadata in the data set.
    const numMetadata = Object.values(properties).filter((o) => o.type === 'metadataCategorical').length;

    if (!numMetadata) {
      setType(ComparisonType.within);
    }
    setHasMetadata(numMetadata > 0);

    // Update the hierarchies if a previously selected set were to be deleted.
    setSelectedGroups(_.mapValues(selectedGroups, (cellSetKey) => {
      if (!cellSetKey) {
        return null;
      }

      const splitKey = cellSetKey.split('/')[1];

      if (cellSetKey === 'all' || cellSetKey === 'background' || splitKey === 'rest') {
        return cellSetKey;
      }

      if (!properties[splitKey]) {
        return null;
      }

      return cellSetKey;
    }));
  }, [hierarchy, properties]);

  const validateForm = () => {
    if (!selectedGroups.cellSet) {
      setIsFormValid(false);
      return;
    }

    if (!selectedGroups.compareWith) {
      setIsFormValid(false);
      return;
    }

    if (!selectedGroups.basis) {
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);
  };

  // Validate form when the groups selected changes.
  useEffect(() => {
    validateForm();
  }, [selectedGroups]);

  /**
   * Updates the selected clusters.
   * @param {string} cellSet The key of the cell set.
   * @param {string} option The option string (`cellSet` or `compareWith`).
   */
  const onSelectCluster = (cellSet, option) => {
    setSelectedGroups({
      ...selectedGroups,
      [option]:
        cellSet,
    });
  };

  /**
   * Constructs a form item, a `Select` field with selectable clusters.
   */
  const renderClusterSelectorItem = ({
    title, option, filterType,
  }) => {
    // Dependiung on the cell set type specified, set the default name
    const placeholder = filterType === 'metadataCategorical' ? 'sample/group' : 'cell set';

    // Get all the stuff we are going to show.
    const tree = composeTree(hierarchy, properties, filterType);

    const renderChildren = (rootKey, children) => {
      if (!children || children.length === 0) { return (<></>); }

      // If this is the `compareWith` option, we need to add `the rest` under the group previously selected.
      if (option === 'compareWith' && selectedGroups.cellSet?.startsWith(`${rootKey}/`)) {
        children.unshift({ key: `rest`, name: `Rest of ${properties[rootKey].name}` });
      }

      const shouldDisable = (key) => {
        // Should always disable something already selected.
        if (Object.values(selectedGroups).includes(key)) {
          return true;
        }

        // Should disable everything in `compareWith` that is not under the same root group as `cellSet`.
        if (option === 'compareWith' && !selectedGroups.cellSet?.startsWith(`${rootKey}/`)) {
          return true;
        }

        return false;
      }

      if (selectedGroups) {
        return children.map(({ key, name }) => {
          const uniqueKey = `${rootKey}/${key}`;

          return <Option key={uniqueKey} disabled={shouldDisable(uniqueKey)}>
            {name}
          </Option>
        });
      }
    };

    return (
      <Form.Item label={title}>
        <Select
          placeholder={`Select a ${placeholder}...`}
          style={{ width: 200 }}
          onChange={(cellSet) => onSelectCluster(cellSet, option)}
          value={selectedGroups[option]}
          size='small'
        >
          {
            option === 'basis' &&
            <Option key='all'>
              All
              </Option>
          }
          {
            option === 'compareWith' &&
            <Option key='background'>
              All other cells
              </Option>
          }
          {
            tree && tree.map(({ key, children }) => (
              <OptGroup label={properties[key]?.name} key={key}>
                {renderChildren(key, [...children])}
              </OptGroup>
            ))
          }
        </Select>
      </Form.Item >
    );
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  return (
    <Form size='small' layout='vertical'>

      <Radio.Group onChange={(e) => {
        setType(e.target.value);

        setSelectedGroups({
          cellSet: null,
          compareWith: null,
          basis: null,
        });
      }} value={type}>
        <Radio style={radioStyle} value={ComparisonType.between} disabled={!hasMetadata}>
          Compare a selected cell set between samples/groups
        </Radio>
        <Radio style={radioStyle} value={ComparisonType.within}>
          Compare cell sets within a sample/group
        </Radio>
      </Radio.Group>

      {type === ComparisonType.between
        ? (
          <>
            {renderClusterSelectorItem({
              title: 'Compare cell set:',
              option: 'basis',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'between sample/group:',
              option: 'cellSet',
              filterType: 'metadataCategorical',
            })}

            {renderClusterSelectorItem({
              title: 'and sample/group:',
              option: 'compareWith',
              filterType: 'metadataCategorical',
            })}
          </>
        )
        : (
          <>
            {renderClusterSelectorItem({
              title: 'Compare cell set:',
              option: 'cellSet',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'and cell set:',
              option: 'compareWith',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'within sample/group:',
              option: 'basis',
              filterType: 'metadataCategorical',
            })}
          </>
        )}

      <p>
        <Text type='secondary'>
          Cite
          {' '}
          <a href='https://github.com/kharchenkolab/conos/blob/master/man/Conos.Rd'>
            Conos$getDifferentialGenes
          </a>
          {' '}
          as appropriate.
        </Text>
      </p>

      <Form.Item>
        <Button
          size='small'
          disabled={!isFormValid}
          onClick={() => onCompute(diffExprType, selectedGroups)}
        >
          Compute
        </Button>
      </Form.Item>
    </Form>
  );
};

DiffExprCompute.defaultProps = {
  diffExprType: null,
};

DiffExprCompute.propTypes = {
  experimentId: PropTypes.string.isRequired,
  diffExprType: PropTypes.string,
  onCompute: PropTypes.func.isRequired,
  cellSets: PropTypes.object.isRequired,
};

export default DiffExprCompute;
