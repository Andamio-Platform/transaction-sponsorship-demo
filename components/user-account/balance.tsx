'use client'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CardanoWallet, MeshProvider } from "@meshsdk/react"
import { Button } from "@/components/ui/button"

export default function UserAccountBalance() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>User Balance</CardTitle>
        </CardHeader>
        <CardContent>

          <CardanoWallet
            label={"Connect a Wallet"}
            persist={true}
            onConnected={() => { console.log('on connected') }}
            cardanoPeerConnect={{
              dAppInfo: {
                name: "Mesh SDK",
                url: "https://meshjs.dev/",
              },
              announce: [
                "wss://dev.btt.cf-identity-wallet.metadata.dev.cf-deployments.org",
              ],
            }}
          />                    <p>Balance: $100</p>
        </CardContent>
      </Card>
    </div>
  )
}