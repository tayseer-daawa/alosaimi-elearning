from typing import Any, TypeVar

from sqlmodel import SQLModel

T = TypeVar("T", bound=SQLModel)


def validate_update_model(
    model_class: type[T], db_obj: T, update_data: dict[Any, Any]
) -> None:
    """
    Validate an update by merging current and update data, raising ValidationError if invalid.
    Does not mutate the ORM object.

    The pattern is usually to call it before db_obj.sqlmodel_update. This will validate the model
    without applying changes to the obj, which db_obj.sqlmodel_update does.
    """
    current_data = db_obj.model_dump()
    updated_data = {**current_data, **update_data}
    # model_validate will raise a ValidationError if the data is invalid
    model_class.model_validate(updated_data)
