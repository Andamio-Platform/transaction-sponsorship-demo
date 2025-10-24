import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockfrostProvider } from "@meshsdk/core";
import { Web3Sdk } from "@utxos/web3-sdk";
import { blockfrostApiKey, web3SdkConfig } from "../config";

export const dynamic = 'force-dynamic';

export default async function SponsorAccountBalance() {
  const blockfrost = new BlockfrostProvider(blockfrostApiKey);

  const sdk = new Web3Sdk({
    ...web3SdkConfig,
    fetcher: blockfrost,
    submitter: blockfrost,
  });

  const wallets = await sdk.wallet.getWallets();
  const wallet = (await sdk.wallet.getWallet(wallets[0].id, 0)).wallet;

  const collateralUtxos = await wallet.getCollateral();
  const utxos = (await wallet.getUtxos()).filter(
    (utxo) =>
      !collateralUtxos.some(
        (c) =>
          c.input.txHash === utxo.input.txHash &&
          c.input.outputIndex === utxo.input.outputIndex
      )
  );

  const balance = utxos.reduce(
    (acc, utxo) =>
      acc +
      Number(utxo.output.amount.find((a) => a.unit === "lovelace")!.quantity),
    0
  );
  const collateral = collateralUtxos.reduce(
    (acc, utxo) =>
      acc +
      Number(utxo.output.amount.find((a) => a.unit === "lovelace")!.quantity),
    0
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Balance: <b>~ {Math.floor(Number(balance) / 1000000)}</b> ADA
          </p>
          <p>
            Collateral: <b>~ {Math.floor(Number(collateral) / 1000000)}</b> ADA
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
