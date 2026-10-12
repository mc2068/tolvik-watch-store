# Storefront without a backend

This site exists to show a Prospect what a premium storefront looks and feels like, so it has no database, accounts or payments: Timepieces are sample data in the repo, the cart lives in the Shopper's browser, and the Demo Checkout ends in a simulated confirmation. A real backend would have tripled the work for something a Prospect never sees in a demo. Timepiece data is read through one access layer so that a paying client's build can replace the sample data with a real store without rewriting the pages.

## Consequences

- The payment step shows a "Demo, no payment taken" notice in place of card fields, so nobody is invited to type a real card number.
- The Demo Admin, when it is built, also runs on sample data only.
