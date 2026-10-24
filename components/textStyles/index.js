import { mount as tornScatter } from './tornScatter';
import { mount as stripMosaic } from './stripMosaic';
import { mount as textOnPath } from './textOnPath';
import { mount as depthDrift } from './depthDrift';
import { mount as densityPortrait } from './densityPortrait';
import { mount as ticker3d } from './ticker3d';
import { mount as silhouetteFlow } from './silhouetteFlow';

// Order is the rotation order — /rando advances one slot every
// STYLE_ROTATION_MS (lib/randoConfig.js), cycling via DailyStyleText.
export const STYLES = [
  { name: 'torn-scatter', mount: tornScatter },
  { name: 'strip-mosaic', mount: stripMosaic },
  { name: 'text-on-path', mount: textOnPath },
  { name: 'depth-drift', mount: depthDrift },
  { name: 'density-portrait', mount: densityPortrait },
  { name: 'ticker-3d', mount: ticker3d },
  { name: 'silhouette-flow', mount: silhouetteFlow },
];
