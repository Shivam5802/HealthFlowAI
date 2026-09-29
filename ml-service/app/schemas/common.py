from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

DataT = TypeVar("DataT")

class BaseResponse(BaseModel, Generic[DataT]):
    success: bool = True
    data: DataT
    message: str = "Execution completed successfully"
    code: Optional[str] = None
