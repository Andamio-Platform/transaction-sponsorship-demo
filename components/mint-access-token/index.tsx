"use client";

import { useWallet } from "@meshsdk/react";
import React from "react";
import { Button } from "../ui/button";
import AndamioSDK from "@andamiojs/sdk";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { BlockfrostProvider, MeshTxBuilder, TxParser } from "@meshsdk/core";
import { CSLSerializer } from "@meshsdk/core-csl";

export function MintAccessToken() {
  return (
    <div>
      <TypographyH3 />
      <ConnectedAddress />
      <BuildTx />
    </div>
  );
}
export function ConnectedAddress() {
  const { wallet, connected } = useWallet();
  const [address, setAddress] = React.useState<string>("");

  React.useEffect(() => {
    const getAddress = async () => {
      if (wallet && connected) {
        const addr = await wallet.getChangeAddress();
        setAddress(addr);
      }
    };
    getAddress();
  }, [wallet, connected]);

  return (
    <div>
      {connected ? (
        <p>
          <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            {address}
          </code>
        </p>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}

export function TypographyH3() {
  return (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      Mint Access Token
    </h3>
  );
}

function BuildTx() {
  const { wallet, connected } = useWallet();
  const [address, setAddress] = React.useState<string>("");
  const [tx, setTx] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");
  const [sponsorTx, setSponsorTx] = React.useState<string>("");
  const [sponsoredTxLoading, setSponsoredTxLoading] =
    React.useState<boolean>(false);
  const [sponsoredTxError, setSponsoredTxError] = React.useState<string>("");
  const [submitLoading, setSubmitLoading] = React.useState<boolean>(false);
  const [txHash, setTxHash] = React.useState<string>("");
  const [alias, setAlias] = React.useState<string>("");

  React.useEffect(() => {
    const getAddress = async () => {
      if (wallet && connected) {
        const addr = await wallet.getChangeAddress();
        setAddress(addr);
      }
    };
    getAddress();
    const alias = Math.random()
      .toString(36)
      .replace(/[0-9]/g, "")
      .substring(0, 6)
      .padEnd(6, "a");
    setAlias(alias);
  }, [wallet, connected]);

  const andamio = new AndamioSDK(
    "https://utxorpc.dolos.preprod.nelsonksh.dev:443",
    "Preprod"
  );

  const blockfrost = new BlockfrostProvider(
  "https://blockfrost1fnqnszsgxy7f6xm0e9a.blockfrost-m1.demeter.run"
  );

  const onClick = () => {
    const buildTransaction = async () => {
      if (connected && address) {
        setLoading(true);
        try {
          const tx = await andamio.transaction.sponsorMintAccessToken({
            userAddress: address,
            alias: alias,
          });
          if (tx) {
            setTx(tx);
          }
        } catch (error) {
          console.error("Failed to build transaction:", error);
          toast("Failed to build transaction", {
            description: "Please check the console for more details.",
          });
          setError("Failed");
        } finally {
          setLoading(false);
        }
      }
    };
    buildTransaction();
    console.log("Transaction built:", tx);
  };

  const onSponsorClick = () => {
    const sponsorTransaction = async () => {
      if (connected && tx) {
        setSponsoredTxLoading(true);
        try {
          // Get UTXOs from API
          const utxosResponse = await fetch('/api/get-utxos');
          const utxosResult = await utxosResponse.json();

          if (!utxosResult.success) {
            throw new Error(utxosResult.error);
          }

          const { sponsorAddress, collateralUtxos, utxos } = utxosResult.data;

          console.log("Collateral UTXOs:", collateralUtxos);
          console.log("UTXOs available for sponsorship:", utxos);

          const serializer = new CSLSerializer();
          const parser = new TxParser(serializer, blockfrost);
          const txParsed = await parser.parse(tx);

          txParsed.inputs = txParsed.inputs.filter(input => 
            input.txIn.txHash !== "8222b0327a95e8c357016a5df64d93d7cf8a585a07c55327ae618a7e00d58d9e"
          );
          txParsed.changeAddress = sponsorAddress;
          txParsed.fee = "0";
          txParsed.collateralReturnAddress = sponsorAddress;
          txParsed.collaterals = [];

          const txBuilder = new MeshTxBuilder({
            serializer,
            fetcher: blockfrost,
            evaluator: blockfrost,
          });
          txBuilder.meshTxBuilderBody = txParsed;

          const unsignedTx = await txBuilder
            .txIn(utxos[0].input.txHash, utxos[0].input.outputIndex)
            .txInCollateral(
              collateralUtxos[0].input.txHash,
              collateralUtxos[0].input.outputIndex
            )
            .complete();

          // Sign transaction via API
          const signResponse = await fetch('/api/sign-transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ unsignedTx }),
          });

          const signResult = await signResponse.json();

          if (!signResult.success) {
            throw new Error(signResult.error);
          }

          setSponsorTx(signResult.data);
        } catch (error) {
          console.error("Failed to sponsor transaction:", error);
          toast("Failed to sponsor transaction", {
            description: "Please check the console for more details.",
          });
          setSponsoredTxError("Failed to sponsor transaction");
        } finally {
          setSponsoredTxLoading(false);
        }
      } else {
        toast("No transaction to sponsor", {
          description: "Please build a transaction first.",
        });
      }
    };
    sponsorTransaction();
  };

  const onSubmitClick = async () => {
    if (sponsorTx) {
      setSubmitLoading(true);
      try {
        const txHash = await blockfrost.submitTx(sponsorTx);
        setTxHash(txHash);
        toast("Transaction submitted successfully", {
          description: `Transaction hash: ${txHash}`,
        });
      } catch (error) {
        console.error("Failed to submit transaction:", error);
        toast("Failed to submit transaction", {
          description: "Please check the console for more details.",
        });
      } finally {
        setSubmitLoading(false);
      }
    } else {
      toast("No sponsored transaction to submit", {
        description: "Please sponsor a transaction first.",
      });
    }
  };

  return (
    <div>
      {connected && (
        <p>
          <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            alias: {alias}
          </code>
        </p>
      )}

      <div className="mt-5 grid grid-cols-3 justify-end w-full gap-4 items-center">
        {connected ? (
          <>
            <Button
              onClick={onClick}
              disabled={loading || tx !== "" || sponsorTx !== ""}
            >
              {loading ? "Building..." : error ? error : "Build Tx"}
            </Button>
            <Button
              disabled={tx === "" || sponsorTx !== ""}
              onClick={onSponsorClick}
            >
              {sponsoredTxLoading
                ? "Sponsoring..."
                : sponsoredTxError
                ? sponsoredTxError
                : "Sponsor Tx"}
            </Button>
            <Button
              disabled={sponsorTx === "" || submitLoading}
              onClick={onSubmitClick}
            >
              {submitLoading
                ? "Submitting..."
                : txHash
                ? "Submitted"
                : "Submit Tx"}
            </Button>
          </>
        ) : (
          <>
            <Button disabled={true}>Build Tx</Button>
            <Button disabled={true}>Sponsor Tx</Button>
            <Button disabled={true}>Submit Tx</Button>
          </>
        )}
      </div>
    </div>
  );
}
