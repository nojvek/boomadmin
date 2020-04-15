if (IS_DEV) require(`preact/debug`); // for preact devtools
import {h, render} from 'preact';

import {JsonBuilder} from './components/json-builder';
// import sampleJson from '../../../simdjson_nodejs/jsonexamples/small/jsoniter_scala/twitter_api_compact_response.json';
import twitterSample from '../../../simdjson_nodejs/jsonexamples/update-center.json';

const sampleJson2 = [
  {
    _id: {
      $oid: `5968dd23fc13ae04d9000001`,
    },
    productName: `sildenafil citrate`,
    supplier: `Wisozk Inc`,
    quantity: 261,
    unitCost: `$10.47`,
  },
  {
    _id: {
      $oid: `5968dd23fc13ae04d9000002`,
    },
    productName: `Mountain Juniperus ashei`,
    supplier: `Keebler-Hilpert`,
    quantity: 292,
    unitCost: `$8.74`,
  },
  {
    _id: {
      $oid: `5968dd23fc13ae04d9000003`,
    },
    productName: `Dextromathorphan HBr`,
    supplier: `Schmitt-Weissnat`,
    quantity: 211,
    unitCost: `$20.53`,
  },
];

render(<JsonBuilder value={twitterSample} />, document.body);
