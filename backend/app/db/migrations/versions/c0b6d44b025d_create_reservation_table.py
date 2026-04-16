"""create_reservation_table

Revision ID: c0b6d44b025d
Revises: aa9e74878dfc
Create Date: 2026-02-25 17:25:04.013543

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c0b6d44b025d'
down_revision = 'aa9e74878dfc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Použije sa pri `alembic upgrade ...`."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'reservations' not in existing_tables:
        op.create_table(
            'reservations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('restaurant_id', sa.Integer(), nullable=False),
            sa.Column('party_size', sa.Integer(), nullable=False),
            sa.Column('reservation_date', sa.Date(), nullable=False),
            sa.Column('reservation_time', sa.Time(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('special_requests', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )

    existing_indexes = {idx['name'] for idx in inspector.get_indexes('reservations')} if 'reservations' in existing_tables else set()

    if 'ix_reservations_reservation_date' not in existing_indexes:
        op.create_index(op.f('ix_reservations_reservation_date'), 'reservations', ['reservation_date'], unique=False)
    if 'ix_reservations_restaurant_id' not in existing_indexes:
        op.create_index(op.f('ix_reservations_restaurant_id'), 'reservations', ['restaurant_id'], unique=False)
    if 'ix_reservations_user_id' not in existing_indexes:
        op.create_index(op.f('ix_reservations_user_id'), 'reservations', ['user_id'], unique=False)


def downgrade() -> None:
    """Použije sa pri `alembic downgrade ...`."""
    op.drop_index(op.f('ix_reservations_user_id'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_restaurant_id'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_reservation_date'), table_name='reservations')
    op.drop_table('reservations')
