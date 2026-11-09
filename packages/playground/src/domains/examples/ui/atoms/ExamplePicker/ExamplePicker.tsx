import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";

import {
  EXAMPLE_BUTTON_LABEL,
  EXAMPLE_LIST_LABEL,
} from "./ExamplePicker.constants";
import type { ExampleOption, ExamplePickerProps } from "./ExamplePicker.types";

const Label = styled("span")({ color: "var(--jsb-muted)" });

/**
 * The button of the top bar that names the example that the sketch is, and opens the list of examples to pick another one. The label is muted and the name of the example is in ink, and the label stands alone when the sketch is none of them.
 * @param props ExamplePicker props.
 * @param props.examples The examples to list.
 * @param props.currentId The id of the example that the sketch on screen is, if any.
 * @param props.onSelect Called with the example that the user picks.
 * @param props.autoFocus Whether the button takes the keyboard focus when it is first rendered.
 * @returns The button and its list, which opens inside the root element of the playground.
 */
export function ExamplePicker<Option extends ExampleOption>({
  examples,
  currentId,
  onSelect,
  autoFocus = false,
}: Readonly<ExamplePickerProps<Option>>): ReactNode {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const listId = useId();
  const isOpen = anchor !== null;
  const current = examples.find(({ id }) => id === currentId);

  return (
    <>
      <Button
        variant="outlined"
        autoFocus={autoFocus}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        endIcon={<Icon name="chevron-down" />}
        onClick={(click) => setAnchor(click.currentTarget)}
      >
        <Label>{EXAMPLE_BUTTON_LABEL}</Label>
        {/* The space is for assistive technology, which reads the label and the name as one text; a flex container drops it from the layout */}
        {current === undefined ? null : ` ${current.title}`}
      </Button>
      <Menu
        id={listId}
        anchorEl={anchor}
        open={isOpen}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { "aria-label": EXAMPLE_LIST_LABEL } }}
      >
        {examples.map((example) => (
          <MenuItem
            key={example.id}
            // The list is a choice of one, so a screen reader says which item is the current one
            role="menuitemradio"
            aria-checked={example.id === currentId}
            selected={example.id === currentId}
            onClick={() => {
              setAnchor(null);
              onSelect(example);
            }}
          >
            {example.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
