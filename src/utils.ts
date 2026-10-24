/** Small shared helpers: class merging, component type guards, resize observer. */

import { useEffect } from "react";
import type { RefObject } from "react";
import { extendTailwindMerge } from "tailwind-merge";

/* ── cx.ts ── */

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: ["display-xs", "display-sm", "display-md", "display-lg", "display-xl", "display-2xl"],
        },
    },
});

/**
 * This function is a wrapper around the twMerge function.
 * It is used to merge the classes inside style objects.
 */
export const cx = twMerge;

/**
 * This function does nothing besides helping us to be able to
 * sort the classes inside style objects which is not supported
 * by the Tailwind IntelliSense by default.
 */
export function sortCx<T extends Record<string, string | number | Record<string, string | number | Record<string, string | number>>>>(classes: T): T {
    return classes;
}

/* ── is-react-component.ts ── */

// Below the import on purpose: the shadcn CLI drops comments that come before a file's first
// statement, which would drop this directive and fail lint in projects installed that way.
// `any` is required here: with `unknown`, the type guards below stop narrowing to component types.
/* eslint-disable @typescript-eslint/no-explicit-any */

type ReactComponent = React.FC<any> | React.ComponentClass<any, any>;

/**
 * Checks if a given value is a function component.
 */
export const isFunctionComponent = (component: any): component is React.FC<any> => {
    return typeof component === "function";
};

/**
 * Checks if a given value is a class component.
 */
export const isClassComponent = (component: any): component is React.ComponentClass<any, any> => {
    return typeof component === "function" && component.prototype && (!!component.prototype.isReactComponent || !!component.prototype.render);
};

/**
 * Checks if a given value is a forward ref component.
 */
export const isForwardRefComponent = (component: any): component is React.ForwardRefExoticComponent<any> => {
    return typeof component === "object" && component !== null && component.$$typeof.toString() === "Symbol(react.forward_ref)";
};

/**
 * Checks if a given value is a valid React component.
 */
export const isReactComponent = (component: any): component is ReactComponent => {
    return isFunctionComponent(component) || isForwardRefComponent(component) || isClassComponent(component);
};

/* ── use-resize-observer.ts ── */

/**
 * Checks if the ResizeObserver API is supported.
 * @returns True if the ResizeObserver API is supported, false otherwise.
 */
function hasResizeObserver() {
    return typeof window.ResizeObserver !== "undefined";
}

/**
 * The options for the useResizeObserver hook.
 */
type useResizeObserverOptionsType<T> = {
    /**
     * The ref to the element to observe.
     */
    ref: RefObject<T | undefined | null> | undefined;
    /**
     * The box to observe.
     */
    box?: ResizeObserverBoxOptions;
    /**
     * The callback function to call when the size changes.
     */
    onResize: () => void;
};

/**
 * A hook that observes the size of an element and calls a callback function when the size changes.
 * @param options - The options for the hook.
 */
export function useResizeObserver<T extends Element>(options: useResizeObserverOptionsType<T>) {
    const { ref, box, onResize } = options;

    useEffect(() => {
        const element = ref?.current;
        if (!element) {
            return;
        }

        if (!hasResizeObserver()) {
            window.addEventListener("resize", onResize, false);

            return () => {
                window.removeEventListener("resize", onResize, false);
            };
        } else {
            const resizeObserverInstance = new window.ResizeObserver((entries) => {
                if (!entries.length) {
                    return;
                }

                onResize();
            });

            resizeObserverInstance.observe(element, { box });

            return () => {
                if (element) {
                    resizeObserverInstance.unobserve(element);
                }
            };
        }
    }, [onResize, ref, box]);
}
