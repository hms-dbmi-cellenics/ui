const validateProjectName = (input, projectNames) => (
  input.length >= 8
  && input.match(/([a-zA-Z\d]{2,}){1,}/gm)
  && input.match(/^[a-zA-Z\s\d-_]{8,}$/gm)
  && !projectNames.has(input)
);

export default validateProjectName;
