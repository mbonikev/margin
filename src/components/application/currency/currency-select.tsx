import type { Selection } from "react-aria-components";
import { Button as AriaButton } from "react-aria-components";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Flag, flagIcon } from "@/components/foundations/flag";
import { currencies, useCurrency } from "@/providers/currency-provider";

export const CurrencySelect = () => {
    const { currency, setCurrency } = useCurrency();

    const onSelectionChange = (keys: Selection) => {
        const next = keys === "all" ? undefined : [...keys][0];
        if (typeof next === "string") setCurrency(next);
    };

    return (
        <Dropdown.Root>
            <AriaButton
                aria-label={`Display currency: ${currency.name}`}
                className="flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-tertiary transition duration-100 ease-linear outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 md:h-9"
            >
                <Flag country={currency.country} className="size-5" />
                {/* Fixed width: codes are all 3 letters but not all the same
                    width, and a reflow here would shift the whole header. */}
                <span className="w-8 text-center">{currency.code}</span>
            </AriaButton>

            <Dropdown.Popover placement="bottom right">
                <Dropdown.Menu
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[currency.code]}
                    onSelectionChange={onSelectionChange}
                    className="max-h-80"
                >
                    {currencies.map((item) => (
                        <Dropdown.Item key={item.code} id={item.code} label={item.code} icon={flagIcon(item.country)} addon={item.symbol} textValue={`${item.code} ${item.name}`} />
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};
