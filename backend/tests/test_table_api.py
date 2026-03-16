def _url(restaurant_id: int, table_id: int | None = None) -> str:
    base = f"/owners/restaurants/{restaurant_id}/tables"
    if table_id is not None:
        return f"{base}/{table_id}"
    return f"{base}/"


class TestTableApi:
    def test_create(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.post(
            _url(restaurant.id),
            headers=headers,
            json={"table_number": 1, "capacity": 4},
        )
        assert resp.status_code == 201
        assert resp.json()["table_number"] == 1

    def test_list(self, test_client, owner, restaurant, create_table, auth_headers):
        create_table(restaurant.id, 1, 4)
        create_table(restaurant.id, 2, 6)
        headers = auth_headers(owner)
        resp = test_client.get(_url(restaurant.id), headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get(self, test_client, owner, restaurant, create_table, auth_headers):
        table = create_table(restaurant.id, 1, 4)
        headers = auth_headers(owner)
        resp = test_client.get(_url(restaurant.id, table.id), headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == table.id

    def test_update(self, test_client, owner, restaurant, create_table, auth_headers):
        table = create_table(restaurant.id, 1, 4)
        headers = auth_headers(owner)
        resp = test_client.put(
            _url(restaurant.id, table.id),
            headers=headers,
            json={"capacity": 6},
        )
        assert resp.status_code == 200
        assert resp.json()["capacity"] == 6

    def test_delete(self, test_client, owner, restaurant, create_table, auth_headers):
        table = create_table(restaurant.id, 1, 4)
        headers = auth_headers(owner)
        resp = test_client.delete(_url(restaurant.id, table.id), headers=headers)
        assert resp.status_code == 204

    def test_no_auth(self, test_client, restaurant):
        resp = test_client.get(_url(restaurant.id))
        assert resp.status_code == 403

    def test_wrong_role(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get(_url(restaurant.id), headers=headers)
        assert resp.status_code == 403

    def test_duplicate_table_number(
        self, test_client, owner, restaurant, create_table, auth_headers,
    ):
        create_table(restaurant.id, 1, 4)
        headers = auth_headers(owner)
        resp = test_client.post(
            _url(restaurant.id),
            headers=headers,
            json={"table_number": 1, "capacity": 6},
        )
        assert resp.status_code == 409

    def test_not_found(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.get(_url(restaurant.id, 9999), headers=headers)
        assert resp.status_code == 404
