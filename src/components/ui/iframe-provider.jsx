import {
    ChakraProvider,
    EnvironmentProvider,
    defaultSystem,
} from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import Iframe, { FrameContextConsumer } from "react-frame-component";

function memoize(func) {
    const cache = new WeakMap();
    return (arg) => {
        if (cache.has(arg)) return cache.get(arg);
        const ret = func(arg);
        cache.set(arg, ret);
        return ret;
    };
}

const createCacheFn = memoize((container) =>
    createCache({ container, key: "frame" })
);

export const IframeProvider = (props) => {
    const { children } = props;
    return (
        <Iframe style={{ width: "100%", minHeight: 400, border: "none" }}>
            <FrameContextConsumer>
                {(frame) => {
                    const head = frame.document?.head;
                    if (!head) return null;
                    return (
                        <CacheProvider value={createCacheFn(head)}>
                            <EnvironmentProvider value={() => head.ownerDocument}>
                                <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
                            </EnvironmentProvider>
                        </CacheProvider>
                    );
                }}
            </FrameContextConsumer>
        </Iframe>
    );
};
