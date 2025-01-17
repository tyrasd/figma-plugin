import { GROUPS, Tags } from "./types";

/**
 * All of this is derived from iD (ISC license)
 * https://github.com/openstreetmap/iD/blob/3dde091fdd3f8c5e54abd9923d642e67adb05064/modules/renderer/features.js
 */

const major_traffic_roads = new Set([
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
]);

const traffic_roads = new Set([
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "unclassified",
  "living_street",
  "busway",
]);

const landuse = new Set([
  "flowerbed",
  "forest",
  "grass",
  "recreation_ground",
  "village_green",
]);

const leisure = new Set([
  "garden",
  "golf_course",
  "nature_reserve",
  "park",
  "pitch",
  "track",
]);

const service_roads = new Set(["service", "road", "track"]);

const paths = new Set([
  "path",
  "footway",
  "cycleway",
  "bridleway",
  "steps",
  "pedestrian",
]);

export function isBuilding(tags: Tags) {
  return (
    (!!tags.building && tags.building !== "no") ||
    tags.parking === "multi-storey" ||
    tags.parking === "sheds" ||
    tags.parking === "carports" ||
    tags.parking === "garage_boxes"
  );
}

export function isWaterLine(tags: Tags) {
  return !!tags.waterway;
}

export function isWater(tags: Tags) {
  return (
    tags.natural === "water" ||
    tags.natural === "coastline" ||
    tags.natural === "bay" ||
    tags.landuse === "pond" ||
    tags.landuse === "basin" ||
    tags.landuse === "reservoir" ||
    tags.landuse === "salt_pond"
  );
}

export function isPath(tags: Tags) {
  return paths.has(tags.highway);
}

export function isTrafficRoadMajor(tags: Tags) {
  return major_traffic_roads.has(tags.highway);
}

export function isTrafficRoad(tags: Tags) {
  return traffic_roads.has(tags.highway);
}

export function isServiceRoad(tags: Tags) {
  return service_roads.has(tags.highway);
}

export function isPark(tags: Tags) {
  return (
    leisure.has(tags.leisure) ||
    landuse.has(tags.landuse) ||
    tags.natural === "wood"
  );
}

export function isRail(tags: Tags) {
  return (
    (!!tags.railway || tags.landuse === "railway") &&
    !(
      traffic_roads.has(tags.highway) ||
      major_traffic_roads.has(tags.highway) ||
      service_roads.has(tags.highway) ||
      paths.has(tags.highway)
    )
  );
}

export function getGroup(tags: Tags, haveRelation?: boolean): GROUPS | null {
  return (
    (isRail(tags) && GROUPS.Rail) ||
    (isServiceRoad(tags) && GROUPS.ServiceRoad) ||
    (isTrafficRoad(tags) && GROUPS.TrafficRoad) ||
    (isTrafficRoadMajor(tags) && GROUPS.TrafficRoadMajor) ||
    (isPath(tags) && GROUPS.Path) ||
    (isWaterLine(tags) && GROUPS.WaterLine) ||
    (isWater(tags) && (haveRelation ? GROUPS.WaterArea : GROUPS.Water)) ||
    (isBuilding(tags) && GROUPS.Building) ||
    (isPark(tags) && GROUPS.Park) ||
    null
  );
}
