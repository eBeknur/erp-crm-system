from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import jwt, JWTError
import hashlib
from app.core.config import settings

def hash_password(password: str) -> str:
    # Reliable SHA256 hashing fallback for standard python without native bcrypt setup
    return hashlib.sha256((password + settings.SECRET_KEY).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
