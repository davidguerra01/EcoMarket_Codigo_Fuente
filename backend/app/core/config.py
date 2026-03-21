from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: Optional[str] = None
    db_host: str = "db"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = "12345"
    db_name: str = "ecomarket_db"

    jwt_secret: str = "eco_market_secreto_super_seguro_2025"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    @property
    def database_url_computed(self) -> str:
        if self.database_url:
            return self.database_url
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
