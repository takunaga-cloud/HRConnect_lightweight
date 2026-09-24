from typing import Any, Dict, Optional

class HRConnectError(Exception):
    """Base exception for HRConnect"""
    def __init__(
        self, 
        message: str, 
        status_code: int = 400, 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details

class ResourceNotFoundError(HRConnectError):
    """Raised when a requested resource is not found"""
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)

class BusinessRuleError(HRConnectError):
    """Raised when a business rule is violated"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)

class UnauthorizedError(HRConnectError):
    """Raised when authentication or authorization fails"""
    def __init__(self, message: str = "Unauthorized", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)

class ForbiddenError(HRConnectError):
    """Raised when access is forbidden"""
    def __init__(self, message: str = "Forbidden", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)
