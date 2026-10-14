import { expect, test } from "vitest";

import { checkShipping, inventOrderNumber } from "@/lib/demo-checkout";

const shipping = {
  name: "Ada Lindqvist",
  email: "ada@example.com",
  address: "Strandvägen 7",
  city: "Stockholm",
  postcode: "114 56",
  country: "Sweden",
};

test("a shipping form filled in throughout has nothing to fix", () => {
  expect(checkShipping(shipping)).toEqual({});
});

test("every field left empty, or only spaces, is asked for by name", () => {
  const blank = {
    name: "",
    email: " ",
    address: "",
    city: "",
    postcode: "",
    country: "  ",
  };

  expect(checkShipping(blank)).toEqual({
    name: "Enter your full name.",
    email: "Enter your email address.",
    address: "Enter your street address.",
    city: "Enter your town or city.",
    postcode: "Enter your postal code.",
    country: "Enter your country.",
  });
});

test("an email address without a name, an @ and a domain is not one", () => {
  for (const email of [
    "ada",
    "ada@",
    "@example.com",
    "ada@example",
    "a da@example.com",
  ]) {
    expect(checkShipping({ ...shipping, email })).toEqual({
      email: "Enter an email address such as name@example.com.",
    });
  }
});

test("a postal code is letters, digits, spaces and hyphens, from three to ten", () => {
  for (const postcode of ["SW1A 1AA", "10115", "114 56", "02-495", "K1A 0B1"]) {
    expect(checkShipping({ ...shipping, postcode })).toEqual({});
  }
  for (const postcode of ["12", "#1234", "12345678901"]) {
    expect(checkShipping({ ...shipping, postcode })).toEqual({
      postcode: "Enter a postal code of letters and digits.",
    });
  }
});

test("an order number is TLV and six digits, never starting at nought", () => {
  expect(inventOrderNumber(() => 0)).toBe("TLV-100000");
  expect(inventOrderNumber(() => 0.5)).toBe("TLV-550000");
  expect(inventOrderNumber(() => 0.9999999)).toBe("TLV-999999");
});
