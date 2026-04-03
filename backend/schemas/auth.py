from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class SocialAuthRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    provider: str = Field(pattern="^(google|github)$")


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
