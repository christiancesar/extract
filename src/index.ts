import { analyticalExtraction } from "./analyticalExtraction";
import { exportContentFromJson, saveToDB } from "./extractContentFromJson";

async function main() {
  await analyticalExtraction();
  await exportContentFromJson();
  await saveToDB();
}

main();
