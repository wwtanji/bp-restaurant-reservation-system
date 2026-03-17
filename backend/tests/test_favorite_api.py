class TestFavorites:
    def test_empty_list(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/favorites/", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_add(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post(f"/favorites/{restaurant.id}", headers=headers)
        assert resp.status_code == 201
        assert resp.json()["restaurant_id"] == restaurant.id

    def test_list_own(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        test_client.post(f"/favorites/{restaurant.id}", headers=headers)
        resp = test_client.get("/favorites/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_duplicate(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        test_client.post(f"/favorites/{restaurant.id}", headers=headers)
        resp = test_client.post(f"/favorites/{restaurant.id}", headers=headers)
        assert resp.status_code == 409

    def test_remove(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        test_client.post(f"/favorites/{restaurant.id}", headers=headers)
        resp = test_client.delete(f"/favorites/{restaurant.id}", headers=headers)
        assert resp.status_code == 204

    def test_remove_nonexistent(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.delete("/favorites/9999", headers=headers)
        assert resp.status_code == 404

    def test_no_auth_list(self, test_client):
        resp = test_client.get("/favorites/")
        assert resp.status_code == 403

    def test_no_auth_add(self, test_client, restaurant):
        resp = test_client.post(f"/favorites/{restaurant.id}")
        assert resp.status_code == 403

    def test_no_auth_remove(self, test_client, restaurant):
        resp = test_client.delete(f"/favorites/{restaurant.id}")
        assert resp.status_code == 403

    def test_add_nonexistent_restaurant(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post("/favorites/9999", headers=headers)
        assert resp.status_code == 404
