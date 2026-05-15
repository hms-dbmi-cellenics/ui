import { quadtree } from 'd3-quadtree';
import { polygon as turfPolygon, point as turfPoint } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import booleanWithin from '@turf/boolean-within';
import booleanContains from '@turf/boolean-contains';
import booleanOverlap from '@turf/boolean-overlap'; // Spatial checks for quadtree node traversal

/**
 * Build a d3 quadtree from cell data for efficient spatial queries
 * @param {Array} cells Array of cell objects with position: [x, y]
 * @returns {Quadtree} D3 quadtree for spatial queries
 */
export const buildCellsQuadTree = (cells) => {
  if (!cells || cells.length === 0) {
    return null;
  }
  return quadtree(cells, (d) => d.position[0], (d) => d.position[1]);
};

/**
 * Select cells within a lasso polygon using quadtree and point-in-polygon tests
 * @param {Quadtree} cellsQuadTree D3 quadtree of cell positions
 * @param {Array} cellsData Array of cell objects with { position, cellId, ... }
 * @param {Array<Array>} coordinates Lasso polygon coordinates [[x1,y1], [x2,y2], ...]
 * @returns {Set} Set of selected cell IDs
 */
export const selectCellsInPolygon = (cellsQuadTree, cellsData, coordinates) => {
  if (!cellsQuadTree || !coordinates || coordinates.length < 3) {
    return new Set();
  }

  const ring = coordinates;

  const selectedCellIds = new Set();

  // Ensure polygon is closed (first point must equal last point for Turf.js)
  const isCoordinateClosed = ring[0][0] === ring[ring.length - 1][0]
    && ring[0][1] === ring[ring.length - 1][1];
  const closedCoordinates = isCoordinateClosed ? ring : [...ring, ring[0]];

  // Convert the lasso coordinates to a turf polygon
  const selectedPolygon = turfPolygon([closedCoordinates]);

  // Traverse the quadtree and check each cell against the polygon
  cellsQuadTree.visit((node, x0, y0, x1, y1) => {
    // Create a bounding box polygon from the quadtree node
    const nodePoints = [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
    const nodePolygon = turfPolygon(nodePoints);

    // Check if node overlaps with the selected polygon
    const nodeContainsSelected = booleanContains(nodePolygon, selectedPolygon);
    const nodeWithinSelected = booleanWithin(nodePolygon, selectedPolygon);
    const nodeOverlapsSelected = booleanOverlap(nodePolygon, selectedPolygon);

    // Skip node if it doesn't interact with the selected polygon
    if (!nodeContainsSelected && !nodeWithinSelected && !nodeOverlapsSelected) {
      return true; // Skip this branch
    }

    // If this is a leaf node with data, check individual points
    if (node.data) {
      let current = node;
      while (current) {
        const cell = current.data;
        const cellPoint = turfPoint(cell.position);

        if (booleanPointInPolygon(cellPoint, selectedPolygon)) {
          selectedCellIds.add(cell.cellId);
        }

        current = current.next;
      }
    }

    // Return false to continue visiting children
    return false;
  });

  return selectedCellIds;
};
