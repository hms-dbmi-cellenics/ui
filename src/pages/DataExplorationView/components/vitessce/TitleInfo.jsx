import React from 'react';


const TitleInfo = (props) => {
  const {
    title, info, children, isScroll, removeGridComponent,
  } = props;
  const childClassName = 'my-child';

  return (
    <>
      <div>
        {title}
        <span className="details pl-2 align-items-end">
          <span className="d-flex justify-content-between">
            {info}
            {/* <ClosePaneButton removeGridComponent={removeGridComponent} /> */}
          </span>
        </span>
      </div>
      <div className={childClassName}>
        {children}
      </div>
    </>
  );
};
