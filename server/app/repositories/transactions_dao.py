from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class TransactionsDAO(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, nullable=False)
    date = Column(Date, nullable=False)
    points = Column(Integer, nullable=False)
    origin = Column(Integer, ForeignKey('users.document_id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    destination = Column(String, nullable=False) # Puede ser un ID de usuarii o un ID de comunidad, segun el estado nos daremos cuenta de esto, pero desppues de un aprove o un reject se colocara aca una C o una U para diferenciar entre user y comunidad
    status = Column(Integer, nullable=False)  # 0-aproved  1-rejected  2-WaitingAdminAproval  3-WaitingUserAproval  
    details = Column(String, nullable=True) # Detalles de la transacción
    created_at = Column(Date, nullable=False)

    # Relaciones
    origin_ref = relationship("UsersDAO", foreign_keys=[origin], back_populates="transactions")