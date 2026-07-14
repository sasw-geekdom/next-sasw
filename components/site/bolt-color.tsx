"use client";

import * as React from "react";
import { BoltShader } from "@/components/site/bolt-shader";
import { DEFAULT_CIRCUIT_COLOR } from "@/lib/tracks";

interface BoltColorValue {
  color: string;
  setColor: (color: string) => void;
}

const BoltColorContext = React.createContext<BoltColorValue>({
  color: DEFAULT_CIRCUIT_COLOR,
  setColor: () => {},
});

export const useBoltColor = () => React.useContext(BoltColorContext);

/** Shares one bolt color between the shader and whatever drives it (e.g. a form). */
export function BoltColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = React.useState(DEFAULT_CIRCUIT_COLOR);
  const value = React.useMemo(() => ({ color, setColor }), [color]);
  return (
    <BoltColorContext.Provider value={value}>
      {children}
    </BoltColorContext.Provider>
  );
}

/** Bolt whose color follows the current circuit selection. */
export function FormBolt() {
  const { color } = useBoltColor();
  return <BoltShader color={color} />;
}
