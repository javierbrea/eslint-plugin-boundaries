export function errorMessage(
  errors: Record<number, string>,
  index: number,
  defaultMessage: string,
) {
  return errors[index] || defaultMessage;
}

export function elementTypesNoRuleMessage({
  file,
  dep,
}: {
  file: string;
  dep: string;
}) {
  return `No rule allowing this dependency was found. File is of type ${file}. Dependency is of type ${dep}`;
}

export function entryPointNoRuleMessage({
  entryPoint,
  dep,
}: {
  entryPoint: string;
  dep: string;
}) {
  return `No rule allows the entry point '${entryPoint}' in dependencies of type ${dep}`;
}

export function externalNoRuleMessage({
  file,
  dep,
}: {
  file: string;
  dep: string;
}) {
  return `No rule allows the usage of external module '${dep}' in elements of type ${file}`;
}

export function noPrivateMessage({ dep }: { dep: string }) {
  return `Dependency is private of element of type ${dep}`;
}
