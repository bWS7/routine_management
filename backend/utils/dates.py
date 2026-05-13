from datetime import datetime, timezone

def get_now_br():
    """Retorna o datetime atual em UTC para persistência no banco."""
    return datetime.now(timezone.utc)
