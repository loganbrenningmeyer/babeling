from pydantic import BaseModel


# -------------------------
# /api/user_preferences
# -------------------------
class UserPreferencesRequest(BaseModel):
    preferred_src_lang: str | None = None
    preferred_tgt_lang: str | None = None
    preferred_ui_lang: str | None = None
    theme: str | None = None

class UserPreferencesResponse(BaseModel):
    preferred_src_lang: str | None
    preferred_tgt_lang: str | None
    preferred_ui_lang: str
    theme: str | None