class ApiError extends Error {

    constructor(
        statusCode,
        message = "something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message)  // message comes from parent class Error as we use super
        this.statusCode = statusCode
        this.errors = errors
        this.message = message
        this.sucess = false  // false as this is for apiError
        this.data = null

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }
}



export { ApiError }