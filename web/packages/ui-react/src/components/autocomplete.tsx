import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { cn } from "@goraebap/design-system/cn";
import {
  autocompleteInputVariants,
  autocompleteItemVariants,
  autocompletePopupVariants,
} from "@goraebap/design-system/recipes/autocomplete";
import { usePortalContainer } from "../lib/portal-container";
import type { ComponentProps } from "react";

export const Autocomplete = BaseAutocomplete.Root;
export const AutocompleteEmpty = BaseAutocomplete.Empty;
export const AutocompleteList = BaseAutocomplete.List;

export function AutocompleteInput({
  className,
  ...props
}: ComponentProps<typeof BaseAutocomplete.Input>) {
  return (
    <BaseAutocomplete.Input
      data-slot="autocomplete-input"
      className={cn(autocompleteInputVariants(), className)}
      {...props}
    />
  );
}

export function AutocompleteContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof BaseAutocomplete.Popup> & { sideOffset?: number }) {
  return (
    <BaseAutocomplete.Portal container={usePortalContainer()}>
      <BaseAutocomplete.Positioner sideOffset={sideOffset} className="z-50">
        <BaseAutocomplete.Popup
          data-slot="autocomplete-content"
          className={cn(autocompletePopupVariants(), className)}
          {...props}
        >
          {children}
        </BaseAutocomplete.Popup>
      </BaseAutocomplete.Positioner>
    </BaseAutocomplete.Portal>
  );
}

export function AutocompleteItem({
  className,
  ...props
}: ComponentProps<typeof BaseAutocomplete.Item>) {
  return (
    <BaseAutocomplete.Item
      data-slot="autocomplete-item"
      className={cn(autocompleteItemVariants(), className)}
      {...props}
    />
  );
}
