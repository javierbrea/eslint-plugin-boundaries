import { useCallback, useMemo, useState } from "react";

import {
  getOpenPlaces,
  toggleChoice,
} from "@/domains/files/ui/helpers/inspectorPlaces";
import type {
  InspectorChoices,
  InspectorPlace,
} from "@/domains/files/ui/helpers/inspectorPlaces";

import type { OpenPlaces } from "./useOpenPlaces.types";

/**
 * Keeps what the user folded or opened in the inspector of a file, by place: `from`, `from.element`, `to.module`, `dependency`. It is state of the component that calls it, so it lasts while that component is mounted, through every change of the file and of the dependency in focus, and it is not in the store, the state store or the URL. A place the user did not touch is open, except the module boxes.
 * @returns Whether each place is open, and how to flip one.
 */
export function useOpenPlaces(): OpenPlaces {
  const [choices, setChoices] = useState<InspectorChoices>({});
  const openPlaces = useMemo(() => getOpenPlaces(choices), [choices]);
  const onToggle = useCallback((place: InspectorPlace) => {
    setChoices((current) => toggleChoice(current, place));
  }, []);

  return { openPlaces, onToggle };
}
