const getSelectOptions = (options) => {
  const selectOptions = [];
  if (!options.length) {
    return;
  }

  Array.from(options).forEach((option) => {
    selectOptions.push({
      value: option.key,
      label: option.name,
    });
  });
  return selectOptions;
};

export default getSelectOptions;
