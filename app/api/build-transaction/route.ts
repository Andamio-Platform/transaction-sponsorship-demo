import { NextRequest, NextResponse } from "next/server";
import {
  BlockfrostProvider,
  builtinByteString,
  bytesToHex,
  conStr0,
  deserializeAddress,
  list,
  MeshTxBuilder,
  stringToHex,
} from "@meshsdk/core";
import { CSLSerializer } from "@meshsdk/core-csl";
import AndamioSDK from "@andamiojs/sdk";
import * as spec from "@utxorpc/spec";

export const dynamic = 'force-dynamic';

const sdk = new AndamioSDK(
  "https://preprod.utxorpc.dolos.andamio.space",
  "Preprod"
);
const provider = sdk.provider;

const universalStaticUtxo = {
  input: {
    outputIndex: 0,
    txHash: "8222b0327a95e8c357016a5df64d93d7cf8a585a07c55327ae618a7e00d58d9e",
  },
  output: {
    address:
      "addr_test1qrsj3xj6q99m4g9tu9mm2lzzdafy04035eya7hjhpus55r204nlu6dmhgpruq7df228h9gpujt0mtnfcnkcaj3wj457q5zv6kz",
    amount: [
      {
        unit: "lovelace",
        quantity: "99000000",
      },
    ],
  },
};

const universalStaticCollateral = {
  input: {
    outputIndex: 0,
    txHash: "5a1edf7da58eff2059030abd456947a96cb2d16b9d8c3822ffff58d167ed8bfc",
  },
  output: {
    address:
      "addr_test1qrsj3xj6q99m4g9tu9mm2lzzdafy04035eya7hjhpus55r204nlu6dmhgpruq7df228h9gpujt0mtnfcnkcaj3wj457q5zv6kz",
    amount: [
      {
        unit: "lovelace",
        quantity: "5000000",
      },
    ],
  },
};

const universalStaticChangeAddress =
  "addr_test1qrsj3xj6q99m4g9tu9mm2lzzdafy04035eya7hjhpus55r204nlu6dmhgpruq7df228h9gpujt0mtnfcnkcaj3wj457q5zv6kz";

interface AliasIndexDatum {
  tag: number;
  anyConstructor: bigint;
  fields: [any, any];
}

/**
 * Parse a generic PlutusData into an AliasIndexDatum
 * Returns null if invalid.
 */
function parseAliasIndexDatum(data: any): AliasIndexDatum | null {
  if (data.case !== "constr") {
    console.warn("[parseAliasIndexDatum] Expected constr, got", data.case);
    return null;
  }

  const constr = data.value;

  if (!constr || constr.fields.length !== 2) {
    console.warn("[parseAliasIndexDatum] Expected exactly 2 fields");
    return null;
  }

  const [field0, field1] = constr.fields;

  if (
    field0.plutusData.case !== "boundedBytes" ||
    field1.plutusData.case !== "boundedBytes"
  ) {
    console.warn(
      "[parseAliasIndexDatum] Fields must be boundedBytes, got",
      field0.plutusData.case,
      field1.plutusData.case
    );
    return null;
  }

  return {
    tag: constr.tag,
    anyConstructor: BigInt(constr.anyConstructor),
    fields: [field0.plutusData.value, field1.plutusData.value],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, alias } = await request.json();

    if (!userAddress || !alias) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
    const extraSponsorshipLovelace = process.env.EXTRA_SPONSORSHIP_LOVELACE || "2000000";

    if (!blockfrostApiKey) {
      console.error("BLOCKFROST_API_KEY not set in environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const addr = deserializeAddress(userAddress);

    console.log("Minting access token for alias:", alias);
    const blockfrost = new BlockfrostProvider(blockfrostApiKey);

    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrost,
      submitter: blockfrost,
      evaluator: blockfrost,
      verbose: true,
      serializer: new CSLSerializer(),
    });

    const indexAddress = provider.core.andamioConfig.indexMS.mSCAddress;
    const globalStateAddress = provider.core.andamioConfig.globalStateS.sCAddress;

    const uUtxosMesh = await blockfrost.fetchAddressUTxOs(userAddress);
    console.log("userUtxos", uUtxosMesh);

    const policyId = provider.core.andamioConfig.indexMS.mSCPolicyID;

    const tokenName = alias;
    const tokenNameHex = stringToHex(tokenName);

    const mintRedeemer = builtinByteString(tokenNameHex);

    const indexUtxotxOutRefRes = await fetch(
      `${request.nextUrl.origin}/api/index-utxo?alias=${alias}`
    );
    const indexUtxotxOutRefJson = await indexUtxotxOutRefRes.json();
    const indexUtxotxOutRef = indexUtxotxOutRefJson.data.indexUtxotxOutRef[0];
    console.log("indexUtxotxOutRef", indexUtxotxOutRef);

    const indexUtxoMeshs = await blockfrost.fetchUTxOs(
      indexUtxotxOutRef.tx_hash,
      indexUtxotxOutRef.index
    );
    const indexUtxoMesh = indexUtxoMeshs[0];
    console.log("indexUtxoMesh", indexUtxoMesh);

    const indexUtxo = await provider.core.aliasIndex.getUtxoByNewAlias(alias);

    const indexTxInRef = {
      txHash: provider.core.andamioConfig.indexMS.mSCTxRef.substring(0, 64),
      txIndex: Number(provider.core.andamioConfig.indexMS.mSCTxRef.substring(65)),
    };

    if (!indexUtxo.parsedValued?.datum?.payload?.plutusData) {
      return NextResponse.json(
        { success: false, error: "Invalid index UTxO datum" },
        { status: 400 }
      );
    }

    const datum = parseAliasIndexDatum(
      indexUtxo.parsedValued.datum.payload
        .plutusData as unknown as spec.cardano.PlutusData
    );

    if (datum === null) {
      return NextResponse.json(
        { success: false, error: "Failed to parse alias index datum" },
        { status: 400 }
      );
    }

    const observerStakeAddress =
      await provider.core.indesxReference.getObserverStakeAddress();
    const protocolTreasuryAddress =
      await provider.core.indesxReference.getProtocolTreasuryAddress();
    const protocolFeeAmountInLovelace =
      await provider.core.indesxReference.getProtocolFeeAmountInLovelace();

    console.log("observerStakeAddress", observerStakeAddress);

    const txCbor = await txBuilder
      .txIn(
        universalStaticUtxo.input.txHash,
        universalStaticUtxo.input.outputIndex,
        universalStaticUtxo.output.amount,
        universalStaticUtxo.output.address,
        0
      )
      .txInCollateral(
        universalStaticCollateral.input.txHash,
        universalStaticCollateral.input.outputIndex,
        universalStaticCollateral.output.amount,
        universalStaticCollateral.output.address
      )
      .withdrawalPlutusScriptV3()
      .withdrawal(observerStakeAddress, "0")
      .withdrawalTxInReference(
        provider.core.andamioConfig.v1GlobalStateObsTxRef.substring(0, 64),
        Number(provider.core.andamioConfig.v1GlobalStateObsTxRef.substring(65))
      )
      .withdrawalRedeemerValue(
        conStr0([builtinByteString(tokenNameHex), builtinByteString("20")]),
        "JSON"
      )
      .spendingPlutusScriptV3()
      .txIn(indexUtxoMesh.input.txHash, indexUtxoMesh.input.outputIndex)
      .txInInlineDatumPresent()
      .spendingTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
      .txInRedeemerValue(conStr0([]), "JSON")
      .mintPlutusScriptV3()
      .mint("1", policyId, "20")
      .mintTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
      .mintRedeemerValue(mintRedeemer, "JSON")
      .mintPlutusScriptV3()
      .mint("1", policyId, "313030" + tokenNameHex)
      .mintTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
      .mintRedeemerValue(mintRedeemer, "JSON")
      .mintPlutusScriptV3()
      .mint("1", policyId, "323232" + tokenNameHex)
      .mintTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
      .mintRedeemerValue(mintRedeemer, "JSON")
      .txOut(protocolTreasuryAddress, [
        {
          unit: "lovelace",
          quantity: protocolFeeAmountInLovelace,
        },
      ])
      .txOut(indexAddress, [
        {
          unit: indexUtxoMesh.output.amount[1].unit,
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(
        conStr0([
          builtinByteString(bytesToHex(datum.fields[0])),
          builtinByteString(tokenNameHex),
        ]),
        "JSON"
      )
      .txOut(indexAddress, [
        {
          unit: policyId + "20",
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(
        conStr0([
          builtinByteString(tokenNameHex),
          builtinByteString(bytesToHex(datum.fields[1])),
        ]),
        "JSON"
      )
      .txOut(globalStateAddress, [
        {
          unit: policyId + "313030" + tokenNameHex,
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(
        conStr0([
          builtinByteString(policyId),
          builtinByteString(tokenNameHex),
          list([]),
          builtinByteString("20"),
        ]),
        "JSON"
      )
      .txOut(userAddress, [
        {
          unit: "lovelace",
          quantity: extraSponsorshipLovelace,
        },
      ])
      .txOut(userAddress, [
        {
          unit: policyId + "323232" + tokenNameHex,
          quantity: "1",
        },
      ])
      .changeAddress(universalStaticChangeAddress)
      .requiredSignerHash(addr.pubKeyHash)
      .complete();

    console.log("Transaction built:", txCbor);

    return NextResponse.json({
      success: true,
      data: {
        transaction: txCbor,
        universalStaticUtxo: universalStaticUtxo,
      },
    });
  } catch (error) {
    console.error("Build transaction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
