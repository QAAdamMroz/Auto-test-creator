import fs from "fs/promises";
import { writeAndRead } from "./util.js";
import { DEFAULT_RESPONSE } from "./default.js";

const input = await fs
.readFile("data.json", "utf8")
.catch(async ({ message }) => {
  if (!message.includes("no such file or directory")) throw(error);

  return await writeAndRead({
    type: "file",
    name: "data.json",
    data: JSON.stringify(DEFAULT_RESPONSE, null, 0),
    messageCreation: "\n  Looks like you don't have \"data.json\" in your directory.\n\n  Therefore, we generated one for you with example response body. \n  You can now paste a valid response body from a request to generate tests for that particular input.",
    messageSuccess: null
  })
});

const { data } = JSON.parse(input);
let output = [];

if (Array.isArray(data))
  output.push(`
  pm.test(\`Expected response data to be array\`, () => {
    try { pm.expect(resData).to.be.an("array") }
    catch { failed = true; throw new Error(\`Data in response is not an array!\`) }
  });
  if (failed) return;
  `);
else
  output.push(`
  pm.test(\`Expected response data to be ${typeof data}\`, () => {
    try { pm.expect(resData).to.be.a("${typeof data}") }
    catch { failed = true; throw new Error(\`Data in response is not ${typeof data}!\`) }
  });
  if (failed) return;
  `);

function generateTests(input, parents = []) {
  if (typeof input !== "object" || Object.keys(input).length <= 0) return;
  if (Array.isArray(input) && input.length > 0 && typeof input[0] !== "object") return; // Don't iterate through non-object array

  const targetObject = Array.isArray(input) ? input[0] : input;
  const rootType = Array.isArray(data) ? `[0]` : ``;

  output.push(`pm.test(\`Expected response data ${parents.length ? `${parents.join(" ").replace(/\[.+?]/g, "")} ` : ""}to have following keys: ${Object.keys(targetObject)}\`, () => {
      let listOfFields = [${Object.keys(targetObject).join(",").replace(/\w+/g, `"$&"`)}];
      pm.expect(resData${rootType}${parents.length ? `.${parents.join(".")}` : ""}).to.have.all.keys(listOfFields)
  })\n`.replace(/^ {2}/gm, ""));

  Object.keys(targetObject).map((key) => {
    if (targetObject[key] === null) return;
    const objectValue = targetObject[key];

    const dependency = {
      title: `${parents.length ? `${parents.join(" ").replace(/\[.+?]/g, "")} ${key}` : `${key}`}`,
      chain: `${rootType}${parents.length ? `.${parents.join(".")}.${key}` : `.${key}`}`
    }
    const type = `${Array.isArray(objectValue) ? "array" : typeof objectValue}`;

    if (typeof objectValue === "object" && Object.keys(objectValue).length > 0) {
      generateTests(objectValue, [...parents, Array.isArray(objectValue) && objectValue.length > 0 ? `${key}[0]` : key]); 
    }

    output.push(`pm.test(\`Expected response data ${dependency.title} to be ${type}\`, () => {
      pm.expect(resData${dependency.chain}).to.be.a("${type}")
    })\n\n`.replace(/^ {2}/gm, ""))
  })
}
generateTests(data);

console.log(
  `
  ########################################################
  const responseData = pm.response.json();
  const { code, description, data: resData } = responseData;
  let failed = false;


  ${output.join("")}
  ########################################################

  You can now paste the returned output into your Postman collection.
  `
);