// find the Y position of an object in the document
// based on https://www.quirksmode.org/js/findpos.html
const findTop = (elem) => {
  let posTop = 0;

  if (!elem.offsetParent) {
    return;
  }
  // recursion to add .offsetTop of an object and all parents of the object
  // until obj.offsetParent is undefined, needed to compare with event.clientY for drag event
  do {
    posTop += elem.offsetTop;
  } while (elem = elem.offsetParent);

  return posTop;
};

const ScrollOnDrag = (treeScrollable) => {
  const treeTop = findTop(treeScrollable);
  // scrollable collapsable tablist is wrapped in a div with overflow
  const tablist = document.getElementsByClassName('ant-collapse')[0].parentNode;
  let interval;

  const handleScrollOnDrag = (event) => {
    const treeHeight = treeScrollable.clientHeight;
    const relY = event.clientY - treeTop + tablist.scrollTop;

    clearInterval(interval);

    // drag event ends with relY = -treeTop, currently hardcoded to ignore
    if (relY < 0 && relY !== -treeTop + tablist.scrollTop) {
      interval = setInterval(() => { treeScrollable.scrollTop -= 5; }, 20);
    }

    if (relY > treeHeight) {
      interval = setInterval(() => { treeScrollable.scrollTop += 5; }, 20);
    }
  };

  document.addEventListener('drag', handleScrollOnDrag);
};

export default ScrollOnDrag;
