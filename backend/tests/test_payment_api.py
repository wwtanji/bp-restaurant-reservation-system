from unittest.mock import patch, MagicMock

from app.models.payment import Payment, PaymentStatus
from app.models.reservation import ReservationStatus


FAKE_SESSION_ID = "cs_test_abc123"
FAKE_CHECKOUT_URL = "https://checkout.stripe.com/pay/cs_test_abc123"
FAKE_PAYMENT_INTENT = "pi_test_xyz789"


def _make_stripe_session(**overrides):
    session = MagicMock()
    session.id = overrides.get("id", FAKE_SESSION_ID)
    session.url = overrides.get("url", FAKE_CHECKOUT_URL)
    session.status = overrides.get("status", "open")
    session.payment_intent = overrides.get("payment_intent", FAKE_PAYMENT_INTENT)
    return session


def _make_payment(db_session, reservation_id, status=PaymentStatus.PAID, amount=500):
    payment = Payment(
        reservation_id=reservation_id,
        stripe_session_id=FAKE_SESSION_ID,
        amount=amount,
        currency="eur",
        status=status,
    )
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    return payment


class TestCreateCheckoutSession:
    @patch("app.services.payment_service.stripe")
    def test_success(
        self, mock_stripe, test_client, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        restaurant.reservation_fee = 500
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        mock_stripe.checkout.Session.create.return_value = _make_stripe_session()

        resp = test_client.post(
            "/payments/create-session",
            headers=auth_headers(customer),
            json={"reservation_id": reservation.id},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "checkout_url" in data
        assert "session_id" in data

    def test_no_auth(self, test_client):
        resp = test_client.post(
            "/payments/create-session",
            json={"reservation_id": 1},
        )
        assert resp.status_code == 403

    @patch("app.services.payment_service.stripe")
    def test_already_paid(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        _make_payment(db_session, reservation.id, PaymentStatus.PAID)

        resp = test_client.post(
            "/payments/create-session",
            headers=auth_headers(customer),
            json={"reservation_id": reservation.id},
        )
        assert resp.status_code == 409

    def test_nonexistent_reservation(self, test_client, customer, auth_headers):
        resp = test_client.post(
            "/payments/create-session",
            headers=auth_headers(customer),
            json={"reservation_id": 9999},
        )
        assert resp.status_code == 404

    @patch("app.services.payment_service.stripe")
    def test_cancelled_reservation_rejected(
        self, mock_stripe, test_client, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CANCELLED,
        )
        resp = test_client.post(
            "/payments/create-session",
            headers=auth_headers(customer),
            json={"reservation_id": reservation.id},
        )
        assert resp.status_code == 400

    @patch("app.services.payment_service.stripe")
    def test_other_users_reservation_rejected(
        self, mock_stripe, test_client, customer, restaurant,
        create_table, create_reservation, create_user,
        future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        other = create_user()
        reservation = create_reservation(
            other.id, restaurant.id, table.id, future_date, default_time,
        )
        resp = test_client.post(
            "/payments/create-session",
            headers=auth_headers(customer),
            json={"reservation_id": reservation.id},
        )
        assert resp.status_code == 404

    @patch("app.services.payment_service.stripe")
    def test_zero_fee_rejected(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        restaurant.reservation_fee = 0
        db_session.commit()
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        resp = test_client.post(
            "/payments/create-session",
            headers=auth_headers(customer),
            json={"reservation_id": reservation.id},
        )
        assert resp.status_code == 400

    @patch("app.services.payment_service.stripe")
    def test_reuses_pending_session(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        _make_payment(db_session, reservation.id, PaymentStatus.PENDING)
        mock_stripe.checkout.Session.retrieve.return_value = _make_stripe_session(status="open")

        resp = test_client.post(
            "/payments/create-session",
            headers=auth_headers(customer),
            json={"reservation_id": reservation.id},
        )
        assert resp.status_code == 201
        mock_stripe.checkout.Session.create.assert_not_called()


class TestWebhookCheckoutCompleted:
    @patch("app.services.payment_service.stripe")
    def test_sets_paid_and_confirms(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.PENDING,
        )
        payment = _make_payment(db_session, reservation.id, PaymentStatus.PENDING)

        session_obj = _make_stripe_session(id=payment.stripe_session_id)
        event = MagicMock()
        event.type = "checkout.session.completed"
        event.data.object = session_obj
        mock_stripe.Webhook.construct_event.return_value = event

        resp = test_client.post(
            "/payments/webhook",
            content=b"payload",
            headers={"stripe-signature": "sig"},
        )
        assert resp.status_code == 200

        db_session.refresh(payment)
        db_session.refresh(reservation)
        assert payment.status == PaymentStatus.PAID
        assert reservation.status == ReservationStatus.CONFIRMED

    @patch("app.services.payment_service.stripe")
    def test_idempotent_skips_already_paid(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        payment = _make_payment(db_session, reservation.id, PaymentStatus.PAID)

        session_obj = _make_stripe_session(id=payment.stripe_session_id)
        event = MagicMock()
        event.type = "checkout.session.completed"
        event.data.object = session_obj
        mock_stripe.Webhook.construct_event.return_value = event

        resp = test_client.post(
            "/payments/webhook",
            content=b"payload",
            headers={"stripe-signature": "sig"},
        )
        assert resp.status_code == 200
        db_session.refresh(payment)
        assert payment.status == PaymentStatus.PAID


class TestWebhookCheckoutExpired:
    @patch("app.services.payment_service.stripe")
    def test_sets_expired(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        payment = _make_payment(db_session, reservation.id, PaymentStatus.PENDING)

        session_obj = _make_stripe_session(id=payment.stripe_session_id)
        event = MagicMock()
        event.type = "checkout.session.expired"
        event.data.object = session_obj
        mock_stripe.Webhook.construct_event.return_value = event

        resp = test_client.post(
            "/payments/webhook",
            content=b"payload",
            headers={"stripe-signature": "sig"},
        )
        assert resp.status_code == 200
        db_session.refresh(payment)
        assert payment.status == PaymentStatus.EXPIRED


class TestRefundOnCancel:
    @patch("app.services.payment_service.stripe")
    def test_user_cancel_triggers_refund(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        payment = _make_payment(db_session, reservation.id, PaymentStatus.PAID)
        mock_stripe.checkout.Session.retrieve.return_value = _make_stripe_session()

        resp = test_client.delete(
            f"/reservations/{reservation.id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 204

        db_session.refresh(payment)
        db_session.refresh(reservation)
        assert reservation.status == ReservationStatus.CANCELLED
        assert payment.status == PaymentStatus.REFUNDED
        mock_stripe.Refund.create.assert_called_once_with(payment_intent=FAKE_PAYMENT_INTENT)

    @patch("app.services.payment_service.stripe")
    def test_owner_cancel_triggers_refund(
        self, mock_stripe, test_client, db_session, customer, owner, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        payment = _make_payment(db_session, reservation.id, PaymentStatus.PAID)
        mock_stripe.checkout.Session.retrieve.return_value = _make_stripe_session()

        resp = test_client.patch(
            f"/reservations/{reservation.id}/status",
            headers=auth_headers(owner),
            json={"status": "cancelled"},
        )
        assert resp.status_code == 200

        db_session.refresh(payment)
        assert payment.status == PaymentStatus.REFUNDED
        mock_stripe.Refund.create.assert_called_once()

    @patch("app.services.payment_service.stripe")
    def test_cancel_without_payment_succeeds(
        self, mock_stripe, test_client, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        resp = test_client.delete(
            f"/reservations/{reservation.id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 204
        mock_stripe.Refund.create.assert_not_called()

    @patch("app.services.payment_service.stripe")
    def test_cancel_with_pending_payment_no_refund(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        _make_payment(db_session, reservation.id, PaymentStatus.PENDING)

        resp = test_client.delete(
            f"/reservations/{reservation.id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 204
        mock_stripe.Refund.create.assert_not_called()

    @patch("app.services.payment_service.stripe")
    def test_complete_does_not_refund(
        self, mock_stripe, test_client, db_session, customer, owner, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        _make_payment(db_session, reservation.id, PaymentStatus.PAID)

        resp = test_client.patch(
            f"/reservations/{reservation.id}/status",
            headers=auth_headers(owner),
            json={"status": "completed"},
        )
        assert resp.status_code == 200
        mock_stripe.Refund.create.assert_not_called()


class TestWebhookChargeRefunded:
    @patch("app.services.payment_service.stripe")
    def test_sets_refunded(
        self, mock_stripe, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        payment = _make_payment(db_session, reservation.id, PaymentStatus.PAID)

        mock_stripe.checkout.Session.retrieve.return_value = _make_stripe_session(
            id=payment.stripe_session_id,
        )

        charge = MagicMock()
        charge.payment_intent = FAKE_PAYMENT_INTENT
        event = MagicMock()
        event.type = "charge.refunded"
        event.data.object = charge
        mock_stripe.Webhook.construct_event.return_value = event

        resp = test_client.post(
            "/payments/webhook",
            content=b"payload",
            headers={"stripe-signature": "sig"},
        )
        assert resp.status_code == 200
        db_session.refresh(payment)
        assert payment.status == PaymentStatus.REFUNDED


class TestListMyPayments:
    def test_returns_payments(
        self, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        _make_payment(db_session, reservation.id, PaymentStatus.PAID)

        resp = test_client.get(
            "/payments/my", headers=auth_headers(customer),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["reservation_id"] == reservation.id
        assert data[0]["status"] == "paid"
        assert data[0]["restaurant_name"] == restaurant.name

    def test_empty_list(self, test_client, customer, auth_headers):
        resp = test_client.get(
            "/payments/my", headers=auth_headers(customer),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_no_auth(self, test_client):
        resp = test_client.get("/payments/my")
        assert resp.status_code == 403


class TestGetPaymentBySession:
    def test_success(
        self, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        payment = _make_payment(db_session, reservation.id)

        resp = test_client.get(
            f"/payments/by-session/{payment.stripe_session_id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == payment.id

    def test_not_found(self, test_client, customer, auth_headers):
        resp = test_client.get(
            "/payments/by-session/nonexistent",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 404

    def test_other_user_rejected(
        self, test_client, db_session, customer, restaurant,
        create_table, create_reservation, create_user,
        future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        other = create_user()
        reservation = create_reservation(
            other.id, restaurant.id, table.id, future_date, default_time,
        )
        payment = _make_payment(db_session, reservation.id)

        resp = test_client.get(
            f"/payments/by-session/{payment.stripe_session_id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 404


class TestGetPaymentByReservation:
    def test_success(
        self, test_client, db_session, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        payment = _make_payment(db_session, reservation.id)

        resp = test_client.get(
            f"/payments/{reservation.id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == payment.id
        assert resp.json()["status"] == "paid"

    def test_no_payment(
        self, test_client, customer, restaurant,
        create_table, create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        resp = test_client.get(
            f"/payments/{reservation.id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 404

    def test_other_user_rejected(
        self, test_client, db_session, customer, restaurant,
        create_table, create_reservation, create_user,
        future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        other = create_user()
        reservation = create_reservation(
            other.id, restaurant.id, table.id, future_date, default_time,
        )
        _make_payment(db_session, reservation.id)

        resp = test_client.get(
            f"/payments/{reservation.id}",
            headers=auth_headers(customer),
        )
        assert resp.status_code == 404
