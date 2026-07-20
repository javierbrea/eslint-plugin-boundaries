// Example of import using a tsconfig path alias
import formatMessage from "@helpers/format-message";

function printMessage(message: string): void {
  console.log(formatMessage(message));
}

export default printMessage;
