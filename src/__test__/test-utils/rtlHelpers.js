import { fireEvent, screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

const selectOption = async (optionName, select) => {
  await userEvent.click(select);
  // userEvent click doesnt trigger the onChange in select
  fireEvent.click(screen.getByText(optionName));
};

export {
  // eslint-disable-next-line import/prefer-default-export
  selectOption,
};
