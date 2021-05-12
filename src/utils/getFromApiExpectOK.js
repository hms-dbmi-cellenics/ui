import CustomError from './customError';
import fetchAPI from './fetchAPI';

const getFromApiExpectOK = async (url, ...extras) => {
  const response = await fetchAPI(url, ...extras);

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  throw new CustomError('There has been an error fetching the data.', response);
};

export default getFromApiExpectOK;
