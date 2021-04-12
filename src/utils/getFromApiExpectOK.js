import fetch from 'better-fetch';
import CustomError from './customError';

const getFromApiExpectOK = async (url) => {
  const response = await fetch(url);

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  throw new CustomError('There has been an error fetching the data.', response);
};

export default getFromApiExpectOK;
