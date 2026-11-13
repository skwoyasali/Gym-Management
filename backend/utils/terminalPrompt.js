import process from "node:process";

export const promptForInput = (label, { masked = false } = {}) =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(
        new Error(
          "Run this command in an interactive terminal; passwords must not be passed as command-line arguments."
        )
      );
      return;
    }

    process.stdout.write(label);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = "";
    const onData = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          process.stdin.removeListener("data", onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          reject(new Error("Operation cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          process.stdin.removeListener("data", onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          value += character;
          process.stdout.write(masked ? "*" : character);
        }
      }
    };
    process.stdin.on("data", onData);
  });
