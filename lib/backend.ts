import { buildNetwork } from "./network";
import { getLerp, proj } from "./projection";
import { request } from "./request";
import { applyStyle, STYLES } from "./styles";
import { BBOX, GROUP_ORDER } from "./types";
import { progress } from "./progress";

let frame = (() => {
  let sel = figma.currentPage.selection[0];
  if (sel?.type === "FRAME") {
    return sel;
  }

  let frame = figma.createFrame();
  frame.resize(720, 360);
  figma.viewport.scrollAndZoomIntoView([frame]);
  return frame;
})();

const aspect = frame.width / frame.height;
const dim = 720;

figma.showUI(__html__, {
  width: Math.round(dim),
  height: Math.round(dim / aspect) + 80,
});

figma.ui.postMessage({
  type: "ratio",
  width: frame.width,
  height: frame.height,
});

figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case "cancel": {
      figma.closePlugin();
      break;
    }
    case "render-map": {
      render(msg.bbox.split(",").map((b: string) => parseFloat(b))).catch(
        (e) => {
          progress(e.message, { error: true });
        }
      );
    }
  }
};

async function render(bbox: BBOX) {
  let { width, height, x, y } = frame;
  const scaleFactor = width / (bbox[2] - bbox[0]);
  const lerp = getLerp(bbox, [width, height], [x, y]);

  progress("Requesting data");

  const j = await request(bbox);
  progress("Building network");

  const { grouped, lines } = buildNetwork(j);
  progress("Creating frame");

  progress(`Drawing (${lines.length} elements)`);

  let drawn = 0;

  clear();

  for (const group of GROUP_ORDER) {
    const lines = grouped.get(group);
    if (!lines) continue;

    const vecs = [];

    const style = STYLES[group]();

    for (const line of lines) {
      drawn++;
      progress(`Drawing (${drawn} / ${lines.length} elements)`);
      const vec = figma.createVector();
      applyStyle(vec, style, scaleFactor);

      if (line.way.tags?.name) {
        vec.name = line.way.tags?.name;
      }

      const data = line.nodes
        .map(
          (node, i) =>
            `${i === 0 ? "M" : "L"} ${lerp(proj([node.lon, node.lat]))}`
        )
        .join(" ");

      vec.vectorPaths = [
        {
          windingRule: "EVENODD",
          data,
        },
      ];

      figma.currentPage.appendChild(vec);
      vecs.push(vec);
    }

    const figmaGroup = figma.group(vecs, frame);
    figmaGroup.expanded = false;
    figmaGroup.name = group;
  }

  progress(`Writing attribution`);

  await createAttribution(frame);

  progress(`Done!`);
}

async function createAttribution(frame: FrameNode) {
  const attribution = figma.createText();
  frame.appendChild(attribution);
  await figma.loadFontAsync(attribution.fontName as FontName);
  attribution.characters = "OpenStreetMap";
  attribution.x = 5;
  attribution.y = 5;
}

function clear() {
  for (const child of (frame as FrameNode).children) {
    child.remove();
  }
}
