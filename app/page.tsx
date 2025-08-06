import { MintAccessToken } from "@/components/mint-access-token";
import SponsorAccountBalance from "@/components/sponsor-account/balance";
import UserAccountBalance from "@/components/user-account/balance";

export const dynamic = 'force-dynamic';

function TypographyH1() {
  return (
    <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
      Andamio Transaction Sponsorship Demo
    </h1>
  )
}

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <TypographyH1 />
        <div className="grid grid-cols-2 justify-end w-full gap-4 items-center">
          <SponsorAccountBalance />
          <UserAccountBalance />
        </div>
        <div className="flex flex-col justify-end w-full items-center gap-4">
          <MintAccessToken />
        </div>
      </main>
    </div>
  );
}
