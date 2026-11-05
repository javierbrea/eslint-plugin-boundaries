/** An item of the tree view: the config node, or a node of the sketch. Its id is its path, and the id of the config node is `eslint.config.js` */
export type ProjectItem = {
  /** The path of the node, which is the id of the item */
  readonly id: string;
  /** The last segment of the path */
  readonly name: string;
  /** What the row reads: the name, with a trailing `/` for a folder */
  readonly label: string;
  /** Whether the item is the config node, a file or a folder */
  readonly kind: "config" | "file" | "folder";
  /** The items inside a folder. The tree view takes a mutable array */
  readonly children: ProjectItem[];
};
