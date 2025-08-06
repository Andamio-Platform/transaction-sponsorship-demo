"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardanoWallet, MeshProvider, useWallet } from "@meshsdk/react";
import { Button } from "@/components/ui/button";
import { ClientMeshProvider } from "../providers/mesh-provider";
import { useEffect, useState } from "react";

export default function UserAccountBalance() {
  const [balance, setBalance] = useState<string>("0");
  const {
    wallet,
    state,
    connected,
    name,
    connecting,
    connect,
    disconnect,
    error,
  } = useWallet();

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && wallet) {
        try {
          const lovelaceBalance = await wallet.getLovelace();
          setBalance(lovelaceBalance);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    fetchBalance();
  }, [connected, wallet]);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>User Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {connected ? (
            <div>
              <p>Balance: <b>~ {Math.floor(Number(balance) / 1000000)}</b> ADA</p>
              <Button className="mt-3" onClick={() => disconnect()}>Disconnect</Button>
            </div>
          ) : (
            <CardanoWallet
              label={"Connect a Wallet"}
              persist={false}
              onConnected={() => {
                console.log("on connected");
              }}
              cardanoPeerConnect={{
                dAppInfo: {
                  name: "Mesh SDK",
                  url: "https://meshjs.dev/",
                },
                announce: [
                  "wss://dev.btt.cf-identity-wallet.metadata.dev.cf-deployments.org",
                ],
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
