from fastapi import HTTPException
from typing import Optional, Dict, Any

class SpectraError(HTTPException):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
        retryable: bool = False
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "error": {
                    "code": code,
                    "message": message,
                    "details": details or {},
                    "retryable": retryable
                }
            }
        )
