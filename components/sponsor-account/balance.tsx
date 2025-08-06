import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlockfrostProvider } from "@meshsdk/core";
import { Web3Sdk } from "@utxos/web3-sdk";

export default async function SponsorAccountBalance() {
  const blockfrost = new BlockfrostProvider(
    "https://blockfrost1fnqnszsgxy7f6xm0e9a.blockfrost-m1.demeter.run"
  );
  const sdk = new Web3Sdk({
    projectId: "13ff4981-bdca-4aad-ba9a-41fe1018fdb0",
    apiKey: "5a725d02-9efd-48d8-b65c-5ad9b381215b",
    network: "testnet",
    privateKey:
      "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg6Iuxu9KuTXz6Wkx2LyGartXdLN6OwmmwEBWNamV3FTihRANCAASdEySWvmzvuIep65EAU8zQbTbuNdkNDkKCFQs7fzipK6Zp+oiGDxKu1KA9+ts8D4H1Pjp7lW0MDDifxvmM52BU",
    fetcher: blockfrost,
    submitter: blockfrost,
  });

  const wallets = await sdk.wallet.getWallets();
  const wallet = (await sdk.wallet.getWallet(wallets[0].id, 0)).wallet;

  const collateralUtxos = await wallet.getCollateral();
  const collateralTxHashes = new Set(
    collateralUtxos.map((utxo) => utxo.input.txHash)
  );

  const balance = (await wallet.getUtxos())
    .filter((utxo) => !collateralTxHashes.has(utxo.input.txHash))
    .reduce(
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
