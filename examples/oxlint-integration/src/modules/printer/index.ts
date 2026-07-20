// Example of import using a tsconfig path alias
import printMessage from "@components/message";

// Example of import using a relative path
import formatMessage from "../../helpers/format-message";

function printFormattedMessage(message: string): void {
  console.log(formatMessage(message));
  printMessage(message);
}

export default printFormattedMessage;
