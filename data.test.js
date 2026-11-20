import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_DATA, I18N, RBAC, dataService } from "./data.js";

test("every UZ dictionary entry has a RU counterpart", () => {
  assert.deepEqual(Object.keys(I18N.uz).sort(), Object.keys(I18N.ru).sort());
});

test("demo dataset contains full monthly series, inventory and transactions", () => {
  assert.equal(DEMO_DATA.revenue.length, 12);
  assert.equal(DEMO_DATA.cost.length, 12);
  assert.ok(DEMO_DATA.inventory.length >= 25);
  assert.ok(DEMO_DATA.transactions.length >= 20);
  assert.ok(DEMO_DATA.debt.length >= 10);
});

test("snapshot and the underlying transaction, debt and inventory totals reconcile", async () => {
  for (let period = 0; period < 5; period++) {
    const s = await dataService.getSnapshot(period);
    const rows = await dataService.getRows("moliya", 0, period);
    const total = (type) =>
      rows.filter((x) => x.type === type).reduce((a, x) => a + x.value, 0);
    assert.equal(total(0), s.revenue);
    assert.equal(total(1), s.cost);
    assert.equal(s.revenue - s.cost, s.profit);
    assert.equal(s.balance, 84e6 + s.profit);
    assert.equal(
      s.debt,
      DEMO_DATA.debt.reduce((a, x) => a + x.value, 0),
    );
    assert.equal(
      s.stock,
      DEMO_DATA.inventory.reduce((a, x) => a + x.value, 0),
    );
  }
});

test("module service blocks disallowed pages and scopes inventory by role", async () => {
  for (let role = 0; role < RBAC.length; role++) {
    for (const page of RBAC[0].filter((key) => !RBAC[role].includes(key))) {
      assert.deepEqual(await dataService.getRows(page, role, 2), []);
    }
  }
  assert.ok((await dataService.getRows("ombor", 4, 2)).every((x) => x.raw));
  assert.ok(
    (await dataService.getRows("ombor", 2, 2)).every((x) => x.value === x.qty),
  );
});
