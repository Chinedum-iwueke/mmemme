import { parseEnvironment, PublicWebEnvironment } from "@mmemme/config";
export async function register() {
  parseEnvironment(PublicWebEnvironment, process.env, "public web");
}
