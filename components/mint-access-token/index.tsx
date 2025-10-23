"use client";

import { useWallet } from "@meshsdk/react";
import React from "react";
import { Button } from "../ui/button";
import AndamioSDK from "@andamiojs/sdk";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { CSLSerializer } from "@meshsdk/core-csl";
import { BlockfrostProvider, MeshTxBuilder, TxParser } from "@meshsdk/core";
import { Input } from "../ui/input";
import { Lock } from "lucide-react";
import { buildTxSponsor, universalStaticUtxo } from "./mint";
import { blockfrostApiKey, REQUIRED_PASSWORD } from "../config";

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
  const [isAliasLocked, setIsAliasLocked] = React.useState<boolean>(false);
  const [password, setPassword] = React.useState<string>("");
  const [checkingAlias, setCheckingAlias] = React.useState<boolean>(false);

  React.useEffect(() => {
    const getAddress = async () => {
      if (wallet && connected) {
        const addr = await wallet.getChangeAddress();
        setAddress(addr);
      }
    };
    getAddress();
  }, [wallet, connected]);

  const handleLockAlias = async () => {
    if (alias.trim() === "") {
      toast("Alias cannot be empty", {
        description: "Please enter a valid alias before locking.",
      });
      return;
    }

    setCheckingAlias(true);
    try {
      const isAvailableRes = await fetch("/api/alias-is-available?alias=" + alias);
      const isAvailable = await isAvailableRes.json();

      console.log("Alias availability response:", isAvailable);

      if (!isAvailable.data.checkStatus.isAvailable) {
        toast("Alias already taken", {
          description: "Please choose a different alias.",
        });
        return;
      }
    } catch (error) {
      console.error("Failed to check alias availability:", error);
      toast("Error checking alias", {
        description: "Please try again.",
      });
      return;
    } finally {
      setCheckingAlias(false);
    }

    if (password !== REQUIRED_PASSWORD) {
      toast("Incorrect password", {
        description: "Please enter the correct password to proceed.",
      });
      return;
    }

    setIsAliasLocked(true);
    toast("Alias locked", {
      description: `Alias "${alias}" has been locked.`,
    });
  };

  const onClick = () => {
    const buildTransaction = async () => {
      if (connected && address) {
        if (!isAliasLocked) {
          toast("Alias not locked", {
            description:
              "Please lock your alias before building the transaction.",
          });
          return;
        }
        setLoading(true);
        try {
          const tx = await buildTxSponsor({
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
          const utxosResponse = await fetch("/api/get-utxos");
          const utxosResult = await utxosResponse.json();

          if (!utxosResult.success) {
            throw new Error(utxosResult.error);
          }

          const { sponsorAddress, collateralUtxos, utxos } = utxosResult.data;

          console.log("Collateral UTXOs:", collateralUtxos);
          console.log("UTXOs available for sponsorship:", utxos);

          const blockfrost = new BlockfrostProvider(blockfrostApiKey);

          const serializer = new CSLSerializer();
          const parser = new TxParser(serializer, blockfrost);
          const txParsed = await parser.parse(tx);

          console.log("inputs Original:", txParsed.inputs);

          // Filter out specific input if needed
          txParsed.inputs = txParsed.inputs.filter(
            (input) => input.txIn.txHash !== universalStaticUtxo.input.txHash
          );
          txParsed.outputs = txParsed.outputs.filter(
            (output) => output.address !== universalStaticUtxo.output.address
          );

          console.log("inputs Filtered:", txParsed.inputs);

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
            .selectUtxosFrom(utxos)
            .txInCollateral(
              collateralUtxos[0].input.txHash,
              collateralUtxos[0].input.outputIndex
            )
            .txOut(sponsorAddress, [
              {
                unit: "lovelace",
                quantity: "5000000",
              },
            ])
            .complete();

          // Sign transaction via API
          const signResponse = await fetch("/api/sign-transaction", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
        const submitResponse = await fetch("/api/submit-transaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ signedTx: sponsorTx }),
        });

        const submitResult = await submitResponse.json();

        if (!submitResult.success) {
          throw new Error(submitResult.error);
        }

        const txHash = submitResult.data;
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
        <div className="mt-5 space-y-2">
          <label className="text-sm font-medium">Enter Alias</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter your alias"
              value={alias}
              onChange={(e: any) => setAlias(e.target.value)}
              disabled={isAliasLocked || checkingAlias}
              className="flex-1"
            />
            <Button
              onClick={handleLockAlias}
              disabled={isAliasLocked || alias.trim() === ""}
              variant={isAliasLocked ? "secondary" : "default"}
              size="icon"
            >
              {checkingAlias ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Password</label>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAliasLocked || checkingAlias}
            />
          </div>

          {isAliasLocked && (
            <p className="text-sm text-muted-foreground">
              Alias locked: <span className="font-semibold">{alias}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 justify-end w-full gap-4 items-center">
        {connected ? (
          <>
            <Button
              onClick={onClick}
              disabled={
                loading || tx !== "" || sponsorTx !== "" || !isAliasLocked
              }
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
