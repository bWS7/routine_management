from datetime import datetime
from zoneinfo import ZoneInfo

def get_now_br():
    """Retorna o datetime atual no fuso horário de Brasília."""
    return datetime.now(ZoneInfo("America/Sao_Paulo"))
