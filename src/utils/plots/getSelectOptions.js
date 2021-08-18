// this returns a formatted array for the select element

const getSelectOptions = (options) => {
  const firstLetterUppercase = (word) => word?.charAt(0).toUpperCase() + word?.slice(1);

  const selectOptions = [];
  if (!options.length) {
    return;
  }
  Array.from(options).forEach((option) => {
    selectOptions.push({
      value: firstLetterUppercase(option.key),
    });
  });
  return selectOptions;
};

export default getSelectOptions;
