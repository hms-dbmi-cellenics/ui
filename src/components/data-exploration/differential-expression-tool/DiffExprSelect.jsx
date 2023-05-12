import React from 'react';
import { composeTree, getCellSetClassKey } from 'utils/cellSets';
import PropTypes from 'prop-types';
import {
  Form, Select,
} from 'antd';

const { Option, OptGroup } = Select;

const DiffExprSelect = (props) => {
  const {
    title, option, filterType, onSelectCluster, selectedComparison, cellSets, value
  } = props;
  // Depending on the cell set type specified, set the default name
  const placeholder = filterType === 'metadataCategorical' ? 'sample/group' : 'cell set';
  const { hierarchy, properties } = cellSets;
  const tree = composeTree(hierarchy, properties, filterType);

  const renderChildren = (rootKey, children) => {
    if (!children || children.length === 0) { return (<></>); }

    // If this is the `compareWith` option, we need to add `the rest` under the group previously selected.
    if (option === 'compareWith' && selectedComparison.cellSet?.startsWith(`${rootKey}/`)) {
      children.unshift({ key: 'rest', name: `Rest of ${properties[rootKey].name}` });
    }

    const shouldDisable = (rootKey, key) => {
      // Should always disable something already selected.
      const isAlreadySelected = Object.values(selectedComparison)?.includes(`${rootKey}/${key}`);

      // or a cell set that is not in the same group as selected previously in `cellSet`
      const parentGroup = getCellSetClassKey(selectedComparison.cellSet);
      const isNotInTheSameGroup = rootKey !== parentGroup;

      return isAlreadySelected || (option === 'compareWith' && isNotInTheSameGroup);
    };

    if (selectedComparison) {
      return children.map(({ key, name }) => {
        const uniqueKey = `${rootKey}/${key}`;
        return (
          <Option key={uniqueKey} disabled={shouldDisable(rootKey, key)}>
            {name}
          </Option>
        );
      });
    }
  };

  return (
    <Form.Item label={title}>
      <Select
        placeholder={`Select a ${placeholder}...`}
        style={{ width: 200 }}
        onChange={(cellSet) => onSelectCluster(cellSet, option)}
        // if we are in the volcano plot, the values are stored in redux, so we can just use the object
        // if we are in batch differential expression, the value is managed by state variables so we send it
        value={value ?? selectedComparison[option] ?? null}
        size='small'
        aria-label={title}
      >
        {
          option === 'basis'
          && (
            <Option key='all'>
              All
            </Option>
          )
        }
        {
          option === 'compareWith'
          && (
            <Option key='background'>
              All other cells
            </Option>
          )
        }
        {
          tree && tree.map(({ key, children }) => (
            <OptGroup label={properties[key]?.name} key={key}>
              {renderChildren(key, [...children])}
            </OptGroup>
          ))
        }
      </Select>
    </Form.Item>
  );
};

DiffExprSelect.defaultProps = {
  value: null,
}

DiffExprSelect.propTypes = {
  title: PropTypes.string.isRequired,
  selectedComparison: PropTypes.object.isRequired,
  cellSets: PropTypes.object.isRequired,
  option: PropTypes.string.isRequired,
  filterType: PropTypes.string.isRequired,
  onSelectCluster: PropTypes.func.isRequired,
};
export default DiffExprSelect;
