import {
  SubstrateExtrinsic,
  SubstrateEvent,
  SubstrateBlock,
} from "@subql/types";
import { Account, AssetIssued, AssetTransferred, LiquidStakingStaked, Transfer } from "../types";
import { Balance } from "@polkadot/types/interfaces";
import { decodeAddress } from "@polkadot/util-crypto";

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  // Do something with each block handler here
}

export async function handleCall(extrinsic: SubstrateExtrinsic): Promise<void> {
  // Do something with a call handler here
}

export async function handleBalancesTransferEvent(event: SubstrateEvent): Promise<void> {
  logger.info(
    `New transfer event found at block ${event.block.block.header.number.toString()}`,
  );

  // Get data from the event
  // The balances.transfer event has the following payload \[from, to, value\]
  // logger.info(JSON.stringify(event));
  const {
    event: {
      data: [from, to, amount],
    },
  } = event;

  const blockNumber: number = event.block.block.header.number.toNumber();

  const fromAccount = await checkAndGetAccount(from.toString(), blockNumber);
  const toAccount = await checkAndGetAccount(to.toString(), blockNumber);

  // Create the new transfer entity
  const evt = Transfer.create({
    id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
    blockNumber,
    date: event.block.timestamp,
    fromId: fromAccount.id,
    toId: toAccount.id,
    amount: (amount as Balance).toBigInt(),
  });

  fromAccount.lastTransferBlock = blockNumber;
  toAccount.lastTransferBlock = blockNumber;

  await Promise.all([fromAccount.save(), toAccount.save(), evt.save()]);
}


export async function handleAssetTransferredEvent(event: SubstrateEvent): Promise<void> {
  logger.info(
    `New assets transferred event found at block ${event.block.block.header.number.toString()}`,
  );

  // Get data from the event
  const {
    event: {
      data: [assetId, from, to],
    },
  } = event;

  const blockNumber: number = event.block.block.header.number.toNumber();
  const fromAccount = await checkAndGetAccount(from.toString(), blockNumber);
  const toAccount = await checkAndGetAccount(to.toString(), blockNumber);

  // Create the new AssetTransferred entity
  const evt = AssetTransferred.create({
    id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
    blockNumber,
    date: event.block.timestamp,
    assetId: Number(assetId.toString()),
    fromId: fromAccount.id,
    toId: toAccount.id,
    // amount: (amount as Balance).toBigInt(),
  });

  fromAccount.lastTransferBlock = blockNumber;
  toAccount.lastTransferBlock = blockNumber;
  await Promise.all([fromAccount.save(), toAccount.save(), evt.save()]);
}

export async function handleAssetIssuedEvent(event: SubstrateEvent): Promise<void> {
  logger.info(
    `New assets issued event found at block ${event.block.block.header.number.toString()}`,
  );

  // Get data from the event
  const {
    event: {
      data: [assetId, owner],
    },
  } = event;

  const blockNumber: number = event.block.block.header.number.toNumber();
  const account = await checkAndGetAccount(owner.toString(), blockNumber);

  // Create the new AssetIssued entity
  const evt = AssetIssued.create({
    id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
    blockNumber,
    date: event.block.timestamp,
    assetId: Number(assetId.toString()),
    ownerId: account.id,
    // amount: (amount as Balance).toBigInt(),
  });

  account.lastTransferBlock = blockNumber;
  await Promise.all([account.save(), evt.save()]);
}

export async function handleLiquidStakingStakedEvent(event: SubstrateEvent): Promise<void> {
  logger.info(
    `New liquidStaking staked event found at block ${event.block.block.header.number.toString()}`,
  );

  // Get data from the event
  const {
    event: {
      data: [who],
    },
  } = event;

  const blockNumber: number = event.block.block.header.number.toNumber();
  const account = await checkAndGetAccount(who.toString(), blockNumber);

  // Create the new AssetIssued entity
  const evt = LiquidStakingStaked.create({
    id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
    blockNumber,
    date: event.block.timestamp,
    whoId: account.id,
    // amount: (amount as Balance).toBigInt(),
  });

  account.lastTransferBlock = blockNumber;
  await Promise.all([account.save(), evt.save()]);
}


async function checkAndGetAccount(
  id: string,
  blockNumber: number,
): Promise<Account> {
  let account = await Account.get(id.toLowerCase());
  if (!account) {
    // We couldn't find the account
    account = Account.create({
      id: id.toLowerCase(),
      publicKey: decodeAddress(id).toString().toLowerCase(),
      firstTransferBlock: blockNumber,
    });
  }
  return account;
}
