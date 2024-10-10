from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class TransactionsDAO(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, nullable=False)
    date = Column(Date, nullable=False)
    points = Column(Integer, nullable=False)
    origin = Column(Integer, ForeignKey('users.document_id'), nullable=False)
    destination = Column(Integer, ForeignKey('users.document_id'), nullable=False)
    status = Column(Integer, nullable=False)  # 0-aproved  1-rejected
    details = Column(String, nullable=True)
    created_at = Column(Date, nullable=False)

    # Relaciones
    origin_ref = relationship("UsersDAO", foreign_keys=[origin], back_populates="transactions")
    destination_ref = relationship("UsersDAO", foreign_keys=[destination])
