import { FilePanePom } from "@/domains/files/ui/organisms/FilePane/FilePane.pom.playwright";

import { FILE_NODE_TEST_ID } from "./FileNode.constants";

/** Page object of the file node, in a browser, which is the file pane with the dependencies of the store. It renders no element of its own: its root is the root of the file pane, which carries the test id of the node in place of its own. */
export class FileNodePom extends FilePanePom {
  protected readonly defaultTestId: string = FILE_NODE_TEST_ID;
}
