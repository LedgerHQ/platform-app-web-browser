import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CSSTransition from "react-transition-group/CSSTransition";
import styled from "styled-components";

import type { Account } from "@ledgerhq/live-app-sdk";
import LedgerLiveApi, { WindowMessageTransport } from "@ledgerhq/live-app-sdk";

import AccountRequest from "./components/AccountRequest";
import ControlBar from "./components/ControlBar";
import CookiesBlocked from "./components/CookiesBlocked";
import Loader from "./components/Loader";

const AppLoaderPageContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;

  &.overlay-enter {
    opacity: 1;
  }
  &.overlay-enter-active {
    opacity: 0;
    transition: opacity 300ms;
  }
  &.overlay-enter-done {
    display: none;
    opacity: 0;
  }
  &.overlay-exit {
    opacity: 0;
  }
  &.overlay-exit-active {
    opacity: 1;
    transition: opacity 200ms;
  }
  &.overlay-exit-done {
    opacity: 1;
  }
`;

const Container = styled.div`
  width: 100%;
  flex: 1;
  position: relative;
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
`;

type WebBrowserProps = {
  webUrl: string;
  webAppName: string;
  currencies: string[];
  initialAccountId: string | undefined;
};

type WebBrowserState = {
  accounts: Account[];
  selectedAccount: Account | undefined;
  clientLoaded: boolean;
  fetchingAccounts: boolean;
  connected: boolean;
  cookiesBlocked: boolean;
};

const initialState = {
  accounts: [],
  selectedAccount: undefined,
  clientLoaded: false,
  fetchingAccounts: false,
  connected: false,
  cookiesBlocked: false,
};

export const WebBrowser = ({
  webUrl,
  webAppName,
  currencies,
  initialAccountId,
}: WebBrowserProps) => {
  const [state, setState] = useState<WebBrowserState>(initialState);

  const {
    accounts,
    selectedAccount,
    clientLoaded,
    connected,
    fetchingAccounts,
    cookiesBlocked,
  } = state;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ledgerAPIRef = useRef<LedgerLiveApi | null>(null);

  const wrapThirdPartyCookiesErrorHandler =
    <T extends unknown[], R>(cb: (...args: T) => R) =>
    (...args: T) => {
      try {
        return cb(...args);
      } catch (err) {
        // specifically catch 'Access is denied...' error on `localStorage`
        // (means that third-party cookies are disabled on host)
        if (err instanceof DOMException && err.code === 18) {
          setState((s) => ({ ...s, cookiesBlocked: true }));
        } else {
          throw err;
        }
      }
    };

  const localStorageSet = wrapThirdPartyCookiesErrorHandler(
    (key: string, val: string) => localStorage.setItem(key, val)
  );

  const localStorageGet = wrapThirdPartyCookiesErrorHandler((key: string) =>
    localStorage.getItem(key)
  );

  const webAppUrl = useMemo(() => {
    const { selectedAccount } = state;
    const webAppUrl = webUrl;

    if (!selectedAccount) return "";

    return webAppUrl.replace("{account.address}", selectedAccount.address);
  }, [webUrl, state.selectedAccount]);

  const setClientLoaded = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      clientLoaded: true,
    }));
  }, [setState]);

  const selectAccount = useCallback(
    (account: Account | undefined) => {
      setState((currentState) => ({
        ...currentState,
        selectedAccount: account,
      }));

      if (account) {
        if (typeof window !== "undefined") {
          localStorageSet("accountId", account.id);
        }
      }
    },
    [setState]
  );

  const requestAccount = useCallback(async () => {
    try {
      const payload = {
        currencies,
        allowAddAccount: true,
      };
      if (ledgerAPIRef.current) {
        const account = await ledgerAPIRef.current.requestAccount(payload);
        selectAccount(account);
      }
    } catch (error) {
      // TODO: handle error
    }
  }, [currencies]);

  const fetchAccounts = useCallback(async () => {
    if (!ledgerAPIRef.current) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      fetchingAccounts: true,
    }));

    const accounts = await ledgerAPIRef.current.listAccounts();

    // filter all accounts matching allowed currencies
    const filteredAccounts = accounts.filter((account: Account) =>
      currencies.includes(account.currency)
    );

    // check if there is a initial account
    const initialAccount = initialAccountId
      ? filteredAccounts.find((account) => account.id === initialAccountId)
      : undefined;

    // get accountId from localstorage
    const storedAccountId: string | null =
      typeof window !== "undefined"
        ? localStorageGet("accountId") || null
        : null;

    // check if an account was saved in localstotage
    const storedAccount =
      storedAccountId !== null
        ? filteredAccounts.find((account) => account.id === storedAccountId)
        : undefined;

    // establish the selected account by order of importance
    const selectedAccount =
      filteredAccounts.length > 0
        ? initialAccount || storedAccount || filteredAccounts[0]
        : undefined;

    setState((currentState) => ({
      ...currentState,
      accounts: filteredAccounts,
      fetchingAccounts: false,
      selectedAccount,
    }));
  }, [currencies, setState, initialAccountId]);

  useEffect(() => {
    const ledgerAPI = new LedgerLiveApi(new WindowMessageTransport());
    ledgerAPI.connect();
    ledgerAPIRef.current = ledgerAPI;

    return () => {
      setState((currentState) => ({
        ...currentState,
        connected: false,
      }));
    };
  }, []);

  useEffect(() => {
    fetchAccounts().then(() => {
      setState((currentState) => ({
        ...currentState,
        connected: true,
      }));
    });
  }, [fetchAccounts]);

  if (cookiesBlocked) {
    return <CookiesBlocked />;
  }

  return (
    <AppLoaderPageContainer>
      <ControlBar desktop>
        <AccountRequest
          selectedAccount={selectedAccount}
          onRequestAccount={requestAccount}
        />
      </ControlBar>
      <Container>
        <CSSTransition in={clientLoaded} timeout={300} classNames="overlay">
          <Overlay>
            <Loader>
              {!connected
                ? "Connecting ..."
                : fetchingAccounts
                ? "Loading accounts ..."
                : accounts.length === 0
                ? "You don't have any accounts"
                : `Loading ${webAppName} ...`}
            </Loader>
          </Overlay>
        </CSSTransition>
        {connected && webAppUrl ? (
          <Iframe
            ref={iframeRef}
            src={webAppUrl}
            allow="clipboard-read; clipboard-write"
            onLoad={setClientLoaded}
          />
        ) : null}
      </Container>
      {!!accounts.length && (
        <ControlBar mobile>
          <AccountRequest
            selectedAccount={selectedAccount}
            onRequestAccount={requestAccount}
          />
        </ControlBar>
      )}
    </AppLoaderPageContainer>
  );
};
