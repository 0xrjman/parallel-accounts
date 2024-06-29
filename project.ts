import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";

import * as dotenv from 'dotenv';
import path from 'path';

const mode = process.env.NODE_ENV || 'production';

// Load the appropriate .env file
const dotenvPath = path.resolve(__dirname, `.env${mode !== 'production' ? `.${mode}` : ''}`);
dotenv.config({ path: dotenvPath });

// Can expand the Datasource processor types via the genreic param
const project: SubstrateProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "parallel-accounts",
  description:
    "This project can be used as a starting point for developing your SubQuery project. It indexes all transfers on Parallel network",
  runner: {
    node: {
      name: "@subql/node",
      version: ">=3.0.1",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /* The genesis hash of the network (hash of block 0) */
    chainId: process.env.CHAIN_ID!,
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: process.env.ENDPOINT!?.split(',') as string[] | string,
    chaintypes: {
      file: "./dist/chaintypes.js",
    },
  },
  dataSources: [
    {
      kind: SubstrateDatasourceKind.Runtime,
      startBlock: 6283518,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          /*{
            kind: SubstrateHandlerKind.Block,
            handler: "handleBlock",
            filter: {
              modulo: 100,
            },
          },*/
          /*{
            kind: SubstrateHandlerKind.Call,
            handler: "handleCall",
            filter: {
              module: "balances",
            },
          },*/
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleBalancesTransferEvent",
            filter: {
              module: "balances",
              method: "Transfer",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferredEvent",
            filter: {
              module: "assets",
              method: "Transferred",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetIssuedEvent",
            filter: {
              module: "assets",
              method: "Issued",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleLiquidStakingStakedEvent",
            filter: {
              module: "liquidStaking",
              method: "Staked",
            },
          }
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
