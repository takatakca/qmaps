import assert from "node:assert/strict";

export async function verifyDirectoryResults(request, owner, customer) {
  const resultsPath = "/v1/directory/results?";
  const resultsCity = new URLSearchParams({ city: "QMAPS QA Results" }).toString();
  const resultsIds = items => items.map(row => Number(row.id.slice(-3)));
  const firstResults = await request(resultsPath + resultsCity + "&limit=1&sort=rating");
  assert.deepEqual(resultsIds(firstResults.items), [1]);
  assert.ok(firstResults.next);
  assert.ok(!firstResults.next.includes(firstResults.items[0].id));
  const remainingResults = await request(resultsPath + "city=qmaps+qa+result%C5%9B&sort=rating&after=" + firstResults.next);
  assert.deepEqual(resultsIds(remainingResults.items), [2, 3, 5]);
  assert.equal(remainingResults.next, null);
  const resultRanks = {
    recommended: [5, 2, 1, 3], rating: [1, 2, 3, 5], reviews: [5, 2, 1, 3], newest: [3, 2, 1, 5],
  };
  for (const [sort, order] of Object.entries(resultRanks)) {
    const response = await request(resultsPath + resultsCity + "&sort=" + sort);
    assert.deepEqual(resultsIds(response.items), order);
    assert.equal(response.next, null);
  }
  assert.equal("owner_user_id" in firstResults.items[0], false);
  const exactCategory = firstResults.items[0].business_categories.find(link => link.categories.slug === "contractors").categories;
  for (const [filters, order] of [
    ["q=cafe&category=contractors&price=2&rating=4.5", [1]],
    ["q=absent&match=" + exactCategory.id, [1]],
    ["q=absent&category=contractors&match=" + exactCategory.id, []],
    ["q=%25", []],
    ["price=2&price=3&rating=4.5", [2, 1]],
    ["open=1", [1]],
    ["service=Offers+Delivery&service=Wheelchair+Accessible", [1]],
    ["service=Offers+Takeout", [3]],
    ["service=Takes+Reservations", [5]],
  ]) {
    const response = await request(resultsPath + resultsCity + "&" + filters);
    assert.deepEqual(resultsIds(response.items), order);
    assert.equal(response.next, null);
  }
  const geoSearch = resultsCity + "&lat=46.8100&lng=-71.213&sort=distance";
  const geoResults = await request(resultsPath + geoSearch);
  assert.deepEqual(resultsIds(geoResults.items), [1, 2, 5, 3]);
  assert.equal(geoResults.items[0].distance_meters, 0);
  assert.ok(geoResults.items[1].distance_meters > 5000 && geoResults.items[1].distance_meters < 6000);
  assert.equal(geoResults.items[3].distance_meters, null);
  for (const [radius, order] of [[1, [1]], [3, [1]], [5, [1]], [10, [1, 2]], [25, [1, 2, 5]]]) {
    assert.deepEqual(resultsIds((await request(resultsPath + geoSearch + "&radius=" + radius)).items), order);
  }
  const sparseUrl = resultsPath + "city=QMAPS+QA+Results+Sparse&service=Offers+Delivery";
  const sparse = await request(sparseUrl);
  assert.deepEqual(sparse.items, []);
  assert.ok(sparse.next);
  const sparseEnd = await request(sparseUrl + "&after=" + sparse.next);
  assert.deepEqual(resultsIds(sparseEnd.items), [386]);
  assert.equal(sparseEnd.next, null);
  for (const invalid of [
    "sort=unknown", "sort=distance", "open=0", "open=1&open=1", "service=offers+delivery",
    "service=Offers+Delivery&service=bad", "price=2,3", "match=bad", "rating=5.1", "rating=1&rating=2",
    "lat=45", "lat=45&lng=-181", "lat=45&lng=-73&lat=45", "lat=45&lng=-73&radius=2",
    "radius=10", "limit=0", "limit=49", "limit=2&limit=3", "after=%25",
  ]) await request(resultsPath + invalid, "GET", null, undefined, 400);
  await request(resultsPath + resultsCity + "&sort=newest&after=" + firstResults.next, "GET", null, undefined, 409);
  await request(resultsPath + resultsCity + "&sort=rating&price=2&after=" + firstResults.next, "GET", null, undefined, 409);
  assert.deepEqual(await request("/v1/browser/directory/results?" + geoSearch), geoResults);
  const webResults = "/v1/browser/directory/results?" + resultsCity + "&limit=1&sort=rating";
  const ownerPage = await request(webResults, "GET", owner.token);
  assert.deepEqual(resultsIds(ownerPage.items), [1]);
  assert.deepEqual(resultsIds((await request(webResults + "&after=" + ownerPage.next, "GET", owner.token)).items), [2]);
  await request(webResults + "&after=" + ownerPage.next, "GET", customer.token, undefined, 409);
  await request(webResults + "&after=" + ownerPage.next, "GET", null, undefined, 409);
  await request(webResults + "&after=" + firstResults.next, "GET", owner.token, undefined, 409);
  console.log("Global results ordering, spatial and service filters, sparse pagination and scoped browser cursors passed.");
}
