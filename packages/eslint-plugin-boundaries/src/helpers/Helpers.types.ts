// TODO: Export values in a map
export type RuleMainKey = "from" | "to" | "target";

export type ValidateRulesOptions = {
  mainKey?: RuleMainKey;
  onlyMainKey?: boolean;
};
