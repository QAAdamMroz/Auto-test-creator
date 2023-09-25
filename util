import { writeFile, readFile, mkdir } from "fs/promises";

async function writeAndRead({ type, name, data, messageCreation, messageSuccess }) {
  console.log(messageCreation);

  switch (type) {
    case "file": {
      await writeFile(`./${name}`, data);
      if (messageSuccess) console.log(messageSuccess);
      return await readFile(`./${name}`);
    }
    case "directory": {
      await mkdir(`./${name}`)
      if (messageSuccess) console.log(messageSuccess);
    }
    default: break;
  }
}

export { writeAndRead };