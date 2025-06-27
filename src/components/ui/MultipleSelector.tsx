"use client";

import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { X } from "lucide-react";
import * as React from "react";
import { forwardRef, useEffect } from "react";

import { Command } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  disable?: boolean;
  /** fixed option that can&lsquo;t be removed. */
  fixed?: boolean;
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined;
}

interface MultipleSelectorProps {
  value?: Option[];
  defaultOptions?: Option[];
  /** manually controlled options */
  options?: Option[];
  placeholder?: string;
  /** Loading component. */
  loadingIndicator?: React.ReactNode;
  /** Empty component. */
  emptyIndicator?: React.ReactNode;
  /** Debounce time for async search. Only work with `onSearch`. */
  delay?: number;
  /**
   * Only work with `onSearch` prop. Trigger search when `onFocus`.
   * For example, when user click on the input, it will trigger the search to get initial options.
   **/
  triggerSearchOnFocus?: boolean;
  /** async search */
  onSearch?: (value: string) => Promise<Option[]>;
  /**
   * sync search. This search will not showing loadingIndicator.
   * The rest props are the same as async search.
   * i.e.: creatable, groupBy, delay.
   **/
  onSearchSync?: (value: string) => Option[];
  onChange?: (options: Option[]) => void;
  /** Limit the maximum number of selected options. */
  maxSelected?: number;
  /** When the number of selected options exceeds the limit, the onMaxSelected will be called. */
  onMaxSelected?: (maxLimit: number) => void;
  /** Hide the placeholder when there are options selected. */
  hidePlaceholderWhenSelected?: boolean;
  disabled?: boolean;
  /** Group the options base on provided key. */
  groupBy?: string;
  className?: string;
  badgeClassName?: string;
  /**
   * First item selected is a default behavior by cmdk. That is why the default is true.
   * This is a workaround solution by add a dummy item.
   *
   * @reference: https://github.com/pacocoursey/cmdk/issues/171
   */
  selectFirstItem?: boolean;
  /** Allow user to create option when there is no option matched. */
  creatable?: boolean;
  /** Props of `Command` */
  commandProps?: React.ComponentPropsWithoutRef<typeof Command>;
  /** Props of `CommandInput` */
  inputProps?: Omit<
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
    "value" | "placeholder" | "disabled"
  >;
  /** hide the clear all button. */
  hideClearAllButton?: boolean;
}

export interface MultipleSelectorRef {
  selectedValue: Option[];
  input: HTMLInputElement;
  focus: () => void;
  reset: () => void;
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * The `CommandEmpty` of shadcn/ui will cause the cmdk empty not rendering correctly.
 * So we create one and copy the `Empty` implementation from `cmdk`.
 *
 * @reference: https://github.com/hsuanyi-chou/shadcn-ui-expansions/issues/34#issuecomment-1949561607
 **/
const CommandEmpty = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CommandPrimitive.Empty>
>(({ className, ...props }, forwardedRef) => {
  const render = useCommandState((state) => state.filtered.count === 0);

  if (!render) return null;

  return (
    <div
      ref={forwardedRef}
      className={cn("px-2 py-4 text-center text-sm", className)}
      cmdk-empty=""
      role="presentation"
      {...props}
    />
  );
});

CommandEmpty.displayName = "CommandEmpty";

const MultipleSelector = React.forwardRef<
  MultipleSelectorRef,
  MultipleSelectorProps
>(
  (
    {
      value,
      onChange,
      placeholder,
      defaultOptions = [],
      options: arrayOptions,
      onSearch,
      onSearchSync,
      loadingIndicator,
      emptyIndicator,
      maxSelected = Number.MAX_SAFE_INTEGER,
      onMaxSelected,
      hidePlaceholderWhenSelected,
      disabled,
      className,
      badgeClassName,
      inputProps,
      hideClearAllButton = false,
    }: MultipleSelectorProps,
    ref: React.Ref<MultipleSelectorRef>
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [selected, setSelected] = React.useState<Option[]>(value || []);
    const [inputValue, setInputValue] = React.useState("");
    const [filteredOptions, setFilteredOptions] =
      React.useState<Option[]>(defaultOptions);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        selectedValue: [...selected],
        input: inputRef.current as HTMLInputElement,
        focus: () => inputRef?.current?.focus(),
        reset: () => setSelected([]),
      }),
      [selected]
    );

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    React.useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
      if (value) {
        setSelected(value);
      }
    }, [value]);

    React.useEffect(() => {
      if (arrayOptions) {
        setFilteredOptions(arrayOptions);
      }
    }, [arrayOptions]);

    const handleSelect = (option: Option) => {
      if (selected.length >= maxSelected) {
        onMaxSelected?.(selected.length);
        return;
      }
      setInputValue("");
      const newOptions = [...selected, option];
      setSelected(newOptions);
      onChange?.(newOptions);
      setOpen(false);
    };

    const handleUnselect = (option: Option) => {
      const newOptions = selected.filter((s) => s.value !== option.value);
      setSelected(newOptions);
      onChange?.(newOptions);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      setOpen(true);

      if (onSearchSync) {
        const results = onSearchSync(value);
        setFilteredOptions(results);
      } else if (onSearch) {
        setIsLoading(true);
        onSearch(value).then((results) => {
          setFilteredOptions(results);
          setIsLoading(false);
        });
      } else {
        const filtered = defaultOptions.filter((option) =>
          option.label.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredOptions(filtered);
      }
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <div
          className={cn(
            "relative min-h-[38px] rounded-lg border border-slate-300 bg-white text-sm transition-shadow focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400",
            {
              "p-1": selected.length !== 0,
              "cursor-text": !disabled && selected.length !== 0,
            },
            !hideClearAllButton && "pe-9",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "relative inline-flex h-8 cursor-default items-center rounded-md border border-slate-300 bg-white pe-8 pl-2 ps-2 text-xs font-medium text-slate-800 transition-all hover:bg-white",
                  badgeClassName
                )}
              >
                {option.label}
                <button
                  className="absolute -inset-y-px -end-px flex size-8 items-center justify-center rounded-e-lg border border-transparent p-0 text-slate-600 outline-0 transition-colors hover:text-foreground"
                  onClick={() => handleUnselect(option)}
                  aria-label="Remove"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
            <input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              disabled={disabled}
              placeholder={
                hidePlaceholderWhenSelected && selected.length !== 0
                  ? ""
                  : placeholder
              }
              className={cn(
                "flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
                {
                  "w-full": hidePlaceholderWhenSelected,
                  "px-3 py-2": selected.length === 0,
                  "ml-1": selected.length !== 0,
                },
                inputProps?.className
              )}
              {...inputProps}
            />
          </div>
          {!hideClearAllButton && selected.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                onChange?.([]);
              }}
              className="absolute end-0 top-0 flex size-9 items-center justify-center rounded-lg border border-transparent text-slate-600 transition-colors hover:text-slate-800"
              aria-label="Clear all"
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
        {open && (
          <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg">
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                loadingIndicator
              ) : filteredOptions.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm">
                  {emptyIndicator || "No options found"}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "cursor-pointer px-2 py-1.5 text-sm hover:bg-slate-100",
                      option.disable && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultipleSelector.displayName = "MultipleSelector";
export default MultipleSelector;
