// this returns a formatted array for the select element;
import _ from 'lodash';

const getSelectOptions = (options) => {
  const selectOptions = [];
  if (!options.length) {
    return;
  }
  Array.from(options).forEach((option) => {
    selectOptions.push({
      value: _.upperFirst(option.key),
    });
  });
  return selectOptions;
};

export default getSelectOptions;
