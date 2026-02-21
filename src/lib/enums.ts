export enum ErrorCode {
  Unauthorized = "UNAUTHORIZED",
  ValidationError = "VALIDATION_ERROR",
  DbListFailed = "DB_LIST_FAILED",
  DbCreateFailed = "DB_CREATE_FAILED",
  InvalidForm = "INVALID_FORM",
  InternalError = "INTERNAL_ERROR",
}

export enum HttpVerb {
  Get = "GET",
  Post = "POST",
  Delete = "DELETE",
  Put = "PUT",
  Patch = "PATCH",
}

export enum ChangeFrequency {
  Always = "always",
  Hourly = "hourly",
  Daily = "daily",
  Weekly = "weekly",
  Monthly = "monthly",
  Yearly = "yearly",
  Never = "never",
}
