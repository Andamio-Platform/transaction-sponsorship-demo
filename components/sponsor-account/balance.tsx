import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function SponsorAccountBalance() {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Sponsor Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Balance: $100</p>
                    <p>Collateral: 5 ADA</p>
                </CardContent>
            </Card>
        </div>
    )
}