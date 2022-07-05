// find the Y position of an object in the document
// based on https://www.quirksmode.org/js/findpos.html
const findPos = (elem) => {
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

const ScrollOnDrag = () => {
  const treeScrollable = document.querySelector('div#ScrollWrapper');
  if (!treeScrollable) return;

  const treeTop = findPos(treeScrollable);
  const treeHeight = treeScrollable.clientHeight;
  let interval;

  const handleScrollOnDrag = (event) => {
    const relY = event.clientY - treeTop;

    clearInterval(interval);

    // drag event ends with relY = -treeTop, currently hardcoded to ignore
    if (relY < 10 && relY !== -treeTop) {
      interval = setInterval(() => { treeScrollable.scrollTop -= 5; }, 20);
    }

    if (relY > treeHeight - 10) {
      interval = setInterval(() => { treeScrollable.scrollTop += 5; }, 20);
    }
  };

  document.addEventListener('drag', handleScrollOnDrag);
};

export default ScrollOnDrag;
