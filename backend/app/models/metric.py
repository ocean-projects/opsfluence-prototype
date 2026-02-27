from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    value = Column(Float, nullable=False)

    incident_id = Column(Integer, ForeignKey("incidents.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))

    incident = relationship("Incident")
    owner = relationship("User")