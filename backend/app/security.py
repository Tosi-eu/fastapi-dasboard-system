import os
import hashlib
import base64
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class SecurityService:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY")
        self.algorithm = os.getenv("JWT_ALGORITHM")
        self.access_token_expire_minutes = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
        ) 

    def get_password_hash(self, password: str) -> str:
        hash_bytes = hashlib.sha256(password.encode("utf-8")).digest()
        return base64.b64encode(hash_bytes).decode("utf-8")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.get_password_hash(plain_password) == hashed_password

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()
        expire = datetime.now() + (
            expires_delta or timedelta(minutes=self.access_token_expire_minutes)
        )
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def decode_token(self, token: str):
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except JWTError:
            return None
