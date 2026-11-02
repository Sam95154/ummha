import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appGradle = path.join(root, "android", "app", "build.gradle");
const required = [
  "MOMIN_UPLOAD_KEYSTORE_PATH",
  "MOMIN_UPLOAD_KEYSTORE_PASSWORD",
  "MOMIN_UPLOAD_KEY_ALIAS",
  "MOMIN_UPLOAD_KEY_PASSWORD",
];
for (const key of required) {
  if (!process.env[key]) throw new Error("Missing required release signing environment variable: " + key);
}
if (!fs.existsSync(process.env.MOMIN_UPLOAD_KEYSTORE_PATH)) {
  throw new Error("The MOMIN upload keystore file was not found.");
}
if (!fs.existsSync(appGradle)) throw new Error("Generated Android app/build.gradle was not found.");

let gradle = fs.readFileSync(appGradle, "utf8");
if (gradle.includes("MOMIN_UPLOAD_KEYSTORE_PATH")) {
  console.log("MOMIN release signing configuration is already present.");
  process.exit(0);
}
const buildTypes = /(^[ \t]*)buildTypes\s*\{/m.exec(gradle);
if (!buildTypes) throw new Error("Could not safely locate the Android buildTypes block.");
const indent = buildTypes[1] || "";
const signingConfig = [
  indent + "signingConfigs {",
  indent + "    release {",
  indent + "        storeFile file(System.getenv('MOMIN_UPLOAD_KEYSTORE_PATH'))",
  indent + "        storePassword System.getenv('MOMIN_UPLOAD_KEYSTORE_PASSWORD')",
  indent + "        keyAlias System.getenv('MOMIN_UPLOAD_KEY_ALIAS')",
  indent + "        keyPassword System.getenv('MOMIN_UPLOAD_KEY_PASSWORD')",
  indent + "    }",
  indent + "}",
  ""
].join("\n");
gradle = gradle.replace(buildTypes[0], signingConfig + buildTypes[0]);
const releaseBlock = /(buildTypes\s*\{\s*release\s*\{)/;
if (!releaseBlock.test(gradle)) throw new Error("Could not safely locate the release build type.");
gradle = gradle.replace(releaseBlock, "$1\n            signingConfig signingConfigs.release");
fs.writeFileSync(appGradle, gradle, "utf8");
console.log("MOMIN Android release signing configuration is ready.");
