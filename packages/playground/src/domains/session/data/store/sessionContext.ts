import { createContext } from "react";

import type { SessionContextValue } from "./SessionProvider.types";

/** The store of the instance and what goes with it. `SessionProvider` provides it; the hooks of the store read it. */
export const SessionContext = createContext<SessionContextValue | null>(null);
