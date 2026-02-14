from pydantic import BaseModel


class MeResponse(BaseModel):
    id: int
    clerkUserId: str
    lastSeenAt: object | None