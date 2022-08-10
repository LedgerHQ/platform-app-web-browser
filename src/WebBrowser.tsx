import React from "react";
import CSSTransition from "react-transition-group/CSSTransition";
import styled from "styled-components";

import type { Account } from "@ledgerhq/live-app-sdk";
import LedgerLiveApi, {
  Mock as LedgerLiveApiMock,
  WindowMessageTransport,
} from "@ledgerhq/live-app-sdk";

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
  mock?: boolean;
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

const getInitialState = (): WebBrowserState => {
  return {
    accounts: [],
    selectedAccount: undefined,
    clientLoaded: false,
    fetchingAccounts: false,
    connected: false,
    cookiesBlocked: false,
  };
};

export class WebBrowser extends React.Component<
  WebBrowserProps,
  WebBrowserState
> {
  ledgerAPI: LedgerLiveApi | LedgerLiveApiMock;
  iframeRef = React.createRef<HTMLIFrameElement>();

  wrapThirdPartyCookiesErrorHandler =
    <T extends unknown[], R>(cb: (...args: T) => R) =>
    (...args: T) => {
      try {
        return cb(...args);
      } catch (err) {
        // specifically catch 'Access is denied...' error on `localStorage`
        // (means that third-party cookies are disabled on host)
        if (err instanceof DOMException && err.code === 18) {
          console.dir(err);
          this.setState({ cookiesBlocked: true });
        } else {
          throw err;
        }
      }
    };

  localStorage = {
    setItem: this.wrapThirdPartyCookiesErrorHandler(
      (key: string, val: string) => localStorage.setItem(key, val)
    ),
    getItem: this.wrapThirdPartyCookiesErrorHandler((key: string) =>
      localStorage.getItem(key)
    ),
  };

  constructor(props: WebBrowserProps) {
    super(props);
    this.state = getInitialState();

    this.setClientLoaded = this.setClientLoaded.bind(this);
    this.selectAccount = this.selectAccount.bind(this);
    this.requestAccount = this.requestAccount.bind(this);
    this.fetchAccounts = this.fetchAccounts.bind(this);
    this.getUrl = this.getUrl.bind(this);

    this.ledgerAPI = props.mock
      ? new LedgerLiveApiMock()
      : new LedgerLiveApi(new WindowMessageTransport());
  }

  async fetchAccounts() {
    this.setState({
      fetchingAccounts: true,
    });
    const currencies = this.props.currencies || [];
    const accounts = await this.ledgerAPI.listAccounts();
    const filteredAccounts = currencies.length
      ? accounts.filter(
          (account: Account) => currencies.indexOf(account.currency) > -1
        )
      : accounts;

    const initialAccount = this.props.initialAccountId
      ? accounts.find(
          (account: Account) => account.id === this.props.initialAccountId
        )
      : undefined;
    const storedAccountId: string | null =
      typeof window !== "undefined"
        ? this.localStorage.getItem("accountId") || null
        : null;
    const storedAccount =
      storedAccountId !== null
        ? accounts.find((account: Account) => account.id === storedAccountId)
        : undefined;

    const selectedAccount =
      filteredAccounts.length > 0
        ? initialAccount || storedAccount || filteredAccounts[0]
        : undefined;

    this.setState({
      accounts: filteredAccounts,
      fetchingAccounts: false,
      selectedAccount,
    });
  }

  async requestAccount() {
    try {
      const currencies = this.props.currencies;
      const payload = currencies.length
        ? {
            currencies,
          }
        : {};
      const account = await this.ledgerAPI.requestAccount(payload);
      this.selectAccount(account);
    } catch (error) {
      // TODO: handle error
    }
  }

  async componentDidMount() {
    this.ledgerAPI.connect();

    await this.fetchAccounts();

    this.setState({
      connected: true,
    });
  }

  componentWillUnmount() {
    this.setState({
      connected: false,
    });
  }

  selectAccount(account: Account | undefined) {
    if (account) {
      if (typeof window !== "undefined") {
        this.localStorage.setItem("accountId", account.id);
      }
    }

    this.setState({
      selectedAccount: account,
    });
  }

  setClientLoaded() {
    this.setState({
      clientLoaded: true,
    });
  }

  getUrl() {
    const { selectedAccount } = this.state;
    const { webUrl } = this.props;

    if (!selectedAccount) return "";

    return webUrl.replace("{account.address}", selectedAccount.address);
  }

  render() {
    const {
      accounts,
      clientLoaded,
      fetchingAccounts,
      connected,
      selectedAccount,
      cookiesBlocked,
    } = this.state;

    const { webAppName } = this.props;

    const url = this.getUrl();

    if (cookiesBlocked) {
      return <CookiesBlocked />;
    }

    return (
      <AppLoaderPageContainer>
        <ControlBar desktop>
          <AccountRequest
            selectedAccount={selectedAccount}
            onRequestAccount={this.requestAccount}
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
          {connected && url ? (
            <Iframe
              ref={this.iframeRef}
              src={url}
              onLoad={this.setClientLoaded}
            />
          ) : null}
        </Container>
        {!!accounts.length && (
          <ControlBar mobile>
            <AccountRequest
              selectedAccount={selectedAccount}
              onRequestAccount={this.requestAccount}
            />
          </ControlBar>
        )}
      </AppLoaderPageContainer>
    );
  }
}
