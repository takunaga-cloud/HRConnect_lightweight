from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import HRConnectError

from app.api.api import api_router
from app.core.config import settings

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from starlette.routing import Match

app = FastAPI(
    title="HR-Connect API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    redirect_slashes=False,
)

class SlashingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path.startswith("/api/v1") and not path.endswith("/"):
            path_with_slash = path + "/"
            original_path = request.scope["path"]
            request.scope["path"] = path_with_slash
            
            match = False
            for route in request.app.router.routes:
                match_result, _ = route.matches(request.scope)
                if match_result == Match.FULL:
                    match = True
                    break
            
            if match:
                raw_path = request.scope.get("raw_path", b"")
                if raw_path and not raw_path.endswith(b"/"):
                    request.scope["raw_path"] = raw_path + b"/"
            else:
                request.scope["path"] = original_path
        
        return await call_next(request)

app.add_middleware(SlashingMiddleware)

class HTTPSSchemeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # X-Forwarded-Protoヘッダーがhttpsの場合、FastAPIの接続スキームをhttpsに書き換える
        if request.headers.get("x-forwarded-proto") == "https":
            request.scope["scheme"] = "https"
        return await call_next(request)

app.add_middleware(HTTPSSchemeMiddleware)

@app.exception_handler(HRConnectError)
async def hr_connect_exception_handler(request: Request, exc: HRConnectError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "details": exc.details
        },
    )

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    # allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    from app.db.dynamodb import create_dynamodb_table_if_not_exists
    print(f"DEBUG DYNAMODB_ENDPOINT_URL: {settings.DYNAMODB_ENDPOINT_URL}")
    print(f"DEBUG AWS_ACCESS_KEY_ID: {settings.AWS_ACCESS_KEY_ID}")
    print(f"DEBUG AWS_REGION: {settings.AWS_REGION}")
    try:
        await create_dynamodb_table_if_not_exists()
        print("DynamoDB table initialization completed successfully.")
    except Exception as e:
        print(f"Failed to initialize DynamoDB table: {e}")

