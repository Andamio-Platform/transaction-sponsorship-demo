import {
  BlockfrostProvider,
  builtinByteString,
  bytesToHex,
  conStr0,
  list,
  MeshTxBuilder,
  stringToHex,
} from "@meshsdk/core";
import { CSLSerializer } from "@meshsdk/core-csl";
import { blockfrostApiKey, extraSponsorshipLovelace } from "../config";
import AndamioSDK from "@andamiojs/sdk";
import * as spec from "@utxorpc/spec";

const sdk = new AndamioSDK(
  "https://preprod.utxorpc.dolos.andamio.space",
  "Preprod"
);
const provider = sdk.provider;

export const universalStaticUtxo = {
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

export async function buildTxSponsor({
  userAddress,
  alias,
}: {
  userAddress: string;
  alias: string;
}) {
  console.log("Minting access token for alias:", alias);
  const blockfrost = new BlockfrostProvider(blockfrostApiKey);

  const txBuilder = new MeshTxBuilder({
    fetcher: blockfrost,
    submitter: blockfrost,
    evaluator: blockfrost,
    // params: params,
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

  const indexUtxotxOutRefRes = await fetch("/api/index-utxo?alias=" + alias);
  const indexUtxotxOutRefJson = await indexUtxotxOutRefRes.json();
  const indexUtxotxOutRef = indexUtxotxOutRefJson.data.indexUtxotxOutRef[0];
  console.log("indexUtxotxOutRef", indexUtxotxOutRef);

  const indexUtxoMeshs = await blockfrost.fetchUTxOs(
    indexUtxotxOutRef.tx_hash,
    indexUtxotxOutRef.index
  ); // Check this
  const indexUtxoMesh = indexUtxoMeshs[0];
  console.log("indexUtxoMesh", indexUtxoMesh);

  const indexUtxo = await provider.core.aliasIndex.getUtxoByNewAlias(alias);

  const indexTxInRef = {
    txHash: provider.core.andamioConfig.indexMS.mSCTxRef.substring(0, 64),
    txIndex: Number(provider.core.andamioConfig.indexMS.mSCTxRef.substring(65)),
  };
  if (!indexUtxo.parsedValued?.datum?.payload?.plutusData) {
    return;
  }

  const datum = parseAliasIndexDatum(
    indexUtxo.parsedValued.datum.payload
      .plutusData as unknown as spec.cardano.PlutusData
  );
  if (datum === null) {
    return;
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
    // .txInCollateral(uUtxosMesh[0].input.txHash, uUtxosMesh[0].input.outputIndex)
    // withdrawal
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
    // existing index utxo
    .spendingPlutusScriptV3()
    .txIn(indexUtxoMesh.input.txHash, indexUtxoMesh.input.outputIndex)
    .txInInlineDatumPresent()
    .spendingTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
    .txInRedeemerValue(conStr0([]), "JSON")
    // index token
    .mintPlutusScriptV3()
    .mint("1", policyId, "20")
    .mintTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
    .mintRedeemerValue(mintRedeemer, "JSON")
    // global state
    .mintPlutusScriptV3()
    .mint("1", policyId, "313030" + tokenNameHex)
    .mintTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
    .mintRedeemerValue(mintRedeemer, "JSON")
    // user token
    .mintPlutusScriptV3()
    .mint("1", policyId, "323232" + tokenNameHex)
    .mintTxInReference(indexTxInRef.txHash, indexTxInRef.txIndex)
    .mintRedeemerValue(mintRedeemer, "JSON")
    // to specified treasury address
    .txOut(protocolTreasuryAddress, [
      {
        unit: "lovelace",
        quantity: protocolFeeAmountInLovelace,
      },
    ])
    // index validator
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
    // global state validator
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
    // user address
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
    .complete();

  console.log("Transaction built:", txCbor);  

  return txCbor;
}

export interface AliasIndexDatum {
  tag: number;
  anyConstructor: bigint;
  fields: [any, any];
}

/**
 * Parse a generic PlutusData into an AliasIndexDatum
 * Returns null if invalid.
 */
export function parseAliasIndexDatum(data: any): AliasIndexDatum | null {
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
