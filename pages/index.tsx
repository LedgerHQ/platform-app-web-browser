import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getQueryVariable } from "../src/helpers";
import { WebBrowser } from "../src/WebBrowser";

function WebBrowserPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const initialAccountId = getQueryVariable("accountId", router);
  const rawParams = getQueryVariable("params", router);

  const params = rawParams ? JSON.parse(rawParams) : {};
  const webAppName = params.webAppName || "WebApp";
  const webUrl = params.webUrl;
  const currencies = params.currencies || [];

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (mounted) {
    return webUrl ? (
      <WebBrowser
        webAppName={webAppName}
        webUrl={webUrl}
        currencies={currencies}
        initialAccountId={initialAccountId}
      />
    ) : null;
  }
  return null;
}

export default WebBrowserPage;
