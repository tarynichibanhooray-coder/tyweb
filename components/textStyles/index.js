import { mount as tornScatter } from './tornScatter';
import { mount as stripMosaic } from './stripMosaic';
import { mount as textOnPath } from './textOnPath';
import { mount as depthDrift } from './depthDrift';
import { mount as densityPortrait } from './densityPortrait';

// Order is the rotation order — index picked by day-of-epoch in DailyStyleText.
export const STYLES = [
  { name: 'torn-scatter', mount: tornScatter },
  { name: 'strip-mosaic', mount: stripMosaic },
  { name: 'text-on-path', mount: textOnPath },
  { name: 'depth-drift', mount: depthDrift },
  { name: 'density-portrait', mount: densityPortrait },
];
