<p align="center">
 <img src="https://user-images.githubusercontent.com/9203826/154288895-670f5c23-81a1-4307-a080-1af83f7f8356.svg" align="center" alt="Ledger" />
 <h2 align="center">Platform App Web Browser</h2>
 <p align="center">Run your Web Application inside <a href="https://www.ledger.com/ledger-live">Ledger Live</a></p>
</p>
  <p align="center">
    <a href="https://opensource.org/licenses/Apache-2.0">
      <img alt="License" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" />
    </a>
    <a href="https://github.com/LedgerHQ/platform-app-web-browser/issues">
      <img alt="Issues" src="https://img.shields.io/github/issues/LedgerHQ/platform-app-web-browser?color=0088ff" />
    </a>
    <a href="https://github.com/LedgerHQ/platform-app-web-browser/pulls">
      <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/LedgerHQ/platform-app-web-browser?color=0088ff" />
    </a>
    <a href="https://discord.gg/y6nZhxv2bC">
      <img alt="Discord" src="https://img.shields.io/discord/885256081289379850?color=1C1CE1&label=Ledger%20%7C%20Discord%20%F0%9F%91%8B%20&style=flat-square" />
    </a>
   
   
  </p>

  <p align="center">
    <a href="https://developers.ledger.com/docs/live-app/start-here/">Full documentation</a>
    ·
    <a href="https://github.com/LedgerHQ/platform-app-web-browser/issues/new/choose">Report Bug</a>
    ·
    <a href="https://github.com/LedgerHQ/platform-app-web-browser/issues/new/choose">Request Feature</a>
  </p>
</p>

# Purpose

This is an application leveraging [Ledger Platform SDK](https://github.com/LedgerHQ/live-app-sdk) to run websites needing cryptocurency address inside a Ledger product (for example [Ledger Live](https://www.ledger.com/ledger-live)).
Some examples of websites that can be used with this Web Browser are [rainbow.me](https://rainbow.me/) or [poap.xyz](https://poap.xyz/).

# How to use it

To make your website use this application, you will need to create a manifest and customize the `params` object based on your website.

Here is an example for the [rainbow.me](https://rainbow.me/) website (with the Web Browser running in local hence the `"url": "http://localhost:3000"`):

```json
{
  "id": "rainbow",
  "name": "Rainbow.me",
  "url": "http://localhost:3000",
  "params": {
    "webUrl": "https://rainbow.me/{account.address}",
    "webAppName": "Rainbow.me",
    "currencies": ["ethereum"]
  },
  "homepageUrl": "https://rainbow.me",
  "icon": "https://cdn.live.ledger.com/icons/platform/rainbow.png",
  "platform": "all",
  "apiVersion": "^1.0.0 || ~0.0.1",
  "manifestVersion": "1",
  "branch": "stable",
  "categories": ["nft"],
  "currencies": ["ethereum"],
  "content": {
    "shortDescription": {
      "en": "An easy way to visualize the NFT secured by your hardware wallet."
    },
    "description": {
      "en": "An easy way to visualize the NFT secured by your hardware wallet."
    }
  },
  "permissions": [],
  "domains": ["https://*"]
}
```

Here is a description of the `params` fields:

- `webUrl`: the url of your website. Use the `{account.address}` placeholder in the url where you expect a cryptocurency address to be provided.
- `webAppName`: the user readable name of your website
- `currencies`: the list of currencies handled by you website

# How to run it

This is a [nextjs](https://nextjs.org/) bootstrapped application, don't hesitate to head over to their website and doc for further details on this framework.

## Install dependencies

```bash
yarn
```

## Run locally

```bash
yarn dev
```

## Format

Check code formatting with

```bash
yarn format:check
```

Format source files in-place with

```bash
yarn format:fix
```

## Lint

Check code quality with

```bash
yarn lint:check
```

Automatically fix code quality problems with

```bash
yarn lint:fix
```
